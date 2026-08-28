// Covers ownership isolation and the abuse guards (cooldown + per-user
// rate limit) that must all reject BEFORE ever calling the Claude API — so
// none of these tests make a real Anthropic request, consistent with
// ARCHITECTURE.md §7 ("nenhuma chamada real à Anthropic durante a
// execução da CI").
import { afterEach, describe, expect, it } from "vitest";

import {
  AiAdvisorCooldownError,
  AiAdvisorRateLimitError,
  decideSuggestion,
  listSuggestions,
  requestAiAnalysis,
} from "@/domain/ai-advisor/service";
import { NotFoundError } from "@/lib/api-errors";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";

const createdUserIds: string[] = [];
const createdProjectIds: string[] = [];

afterEach(async () => {
  if (createdProjectIds.length > 0) {
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    createdProjectIds.length = 0;
  }
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function createTestUser(email: string) {
  const user = await createUser({
    name: "Usuário de Teste",
    email,
    password: "correct-password",
  });
  createdUserIds.push(user.id);
  return user;
}

async function createTestProject(userId: string, name = "Projeto de Teste") {
  const project = await prisma.project.create({
    data: { name, owner: "QA", startDate: new Date(), userId },
  });
  createdProjectIds.push(project.id);
  return project;
}

describe("requestAiAnalysis", () => {
  it("rejects a project that does not exist, before calling Claude", async () => {
    const user = await createTestUser("ai-advisor-404@example.com");
    await expect(requestAiAnalysis("nonexistent-id", user.id)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("rejects another user's project (cross-user isolation), before calling Claude", async () => {
    const owner = await createTestUser("ai-advisor-owner@example.com");
    const intruder = await createTestUser("ai-advisor-intruder@example.com");
    const project = await createTestProject(owner.id);

    await expect(requestAiAnalysis(project.id, intruder.id)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("rejects when the per-project cooldown has not elapsed, before calling Claude", async () => {
    const user = await createTestUser("ai-advisor-cooldown@example.com");
    const project = await createTestProject(user.id);
    await prisma.aiSuggestion.create({
      data: {
        projectId: project.id,
        type: "EXECUTIVE_SUMMARY",
        content: {},
        status: "PENDING",
      },
    });

    await expect(requestAiAnalysis(project.id, user.id)).rejects.toThrow(
      AiAdvisorCooldownError,
    );
  });

  it("rejects when the per-user daily analysis limit is reached, before calling Claude", async () => {
    const user = await createTestUser("ai-advisor-ratelimit@example.com");
    const project = await createTestProject(user.id);

    // 20 prior analyses (one EXECUTIVE_SUMMARY each) across the user's
    // account is the documented daily limit — seed exactly that many.
    await prisma.aiSuggestion.createMany({
      data: Array.from({ length: 20 }, () => ({
        projectId: project.id,
        type: "EXECUTIVE_SUMMARY" as const,
        content: {},
        status: "PENDING" as const,
      })),
    });

    await expect(requestAiAnalysis(project.id, user.id)).rejects.toThrow(
      AiAdvisorRateLimitError,
    );
  });
});

describe("listSuggestions", () => {
  it("lists suggestions for the caller's own project", async () => {
    const user = await createTestUser("ai-advisor-list-owner@example.com");
    const project = await createTestProject(user.id);
    await prisma.aiSuggestion.create({
      data: {
        projectId: project.id,
        type: "EXECUTIVE_SUMMARY",
        content: {},
        status: "PENDING",
      },
    });

    const suggestions = await listSuggestions(project.id, user.id);
    expect(suggestions).toHaveLength(1);
  });

  it("rejects another user's project (cross-user isolation)", async () => {
    const owner = await createTestUser("ai-advisor-list-owner2@example.com");
    const intruder = await createTestUser("ai-advisor-list-intruder@example.com");
    const project = await createTestProject(owner.id);

    await expect(listSuggestions(project.id, intruder.id)).rejects.toThrow(NotFoundError);
  });
});

describe("decideSuggestion", () => {
  it("updates the status of the caller's own suggestion", async () => {
    const user = await createTestUser("ai-advisor-decide-owner@example.com");
    const project = await createTestProject(user.id);
    const suggestion = await prisma.aiSuggestion.create({
      data: { projectId: project.id, type: "RISK", content: {}, status: "PENDING" },
    });

    const updated = await decideSuggestion(suggestion.id, user.id, "ACCEPTED");
    expect(updated.status).toBe("ACCEPTED");
  });

  it("rejects another user's suggestion (cross-user isolation)", async () => {
    const owner = await createTestUser("ai-advisor-decide-owner2@example.com");
    const intruder = await createTestUser("ai-advisor-decide-intruder@example.com");
    const project = await createTestProject(owner.id);
    const suggestion = await prisma.aiSuggestion.create({
      data: { projectId: project.id, type: "RISK", content: {}, status: "PENDING" },
    });

    await expect(
      decideSuggestion(suggestion.id, intruder.id, "DISMISSED"),
    ).rejects.toThrow(NotFoundError);
  });
});
