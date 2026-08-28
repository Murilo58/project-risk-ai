// Integration test: create a real project + risk, then verify the
// Health Score route reflects it and persists a snapshot — exercising the
// Route Handler, the domain engine, and Prisma together.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { GET } from "@/app/api/projects/[projectId]/health-score/route";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { authCookieHeader } from "@/test/auth";

let projectId: string | null = null;
let testUserId: string;
let cookie: string;

beforeAll(async () => {
  const user = await createUser({
    name: "Usuário de Teste — Health Score",
    email: "health-score-integration-test@example.com",
    password: "correct-password",
  });
  testUserId = user.id;
  cookie = await authCookieHeader(testUserId);
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: testUserId } });
});

afterEach(async () => {
  if (projectId) {
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    projectId = null;
  }
});

function makeContext(id: string) {
  return { params: Promise.resolve({ projectId: id }) };
}

describe("GET /api/projects/:id/health-score", () => {
  it("penalizes an open critical risk with no mitigation and persists a snapshot", async () => {
    const project = await prisma.project.create({
      data: {
        name: "Projeto com Risco Crítico",
        owner: "QA",
        startDate: new Date(),
        userId: testUserId,
      },
    });
    projectId = project.id;

    await prisma.risk.create({
      data: {
        projectId: project.id,
        title: "Risco crítico de teste",
        category: "TECHNOLOGY",
        probability: 5,
        impact: 5,
        severity: 25,
        owner: "QA",
        status: "OPEN",
      },
    });

    const response = await GET(
      new Request("http://localhost", { headers: { Cookie: cookie } }),
      makeContext(project.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.score).toBeLessThan(100);
    expect(body.dimensions.risks.penalty).toBeGreaterThan(0);

    const snapshot = await prisma.healthScoreSnapshot.findFirst({
      where: { projectId: project.id },
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot?.overallScore).toBe(body.score);
  });

  it("returns 404 for a project that does not exist", async () => {
    const response = await GET(
      new Request("http://localhost", { headers: { Cookie: cookie } }),
      makeContext("nonexistent-id"),
    );
    expect(response.status).toBe(404);
  });

  it("returns 401 without a valid session", async () => {
    const response = await GET(new Request("http://localhost"), makeContext("any-id"));
    expect(response.status).toBe(401);
  });

  it("returns 404 when the project belongs to a different user (cross-user isolation)", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-health-score@example.com",
      password: "correct-password",
    });
    const otherProject = await prisma.project.create({
      data: {
        name: "Projeto de Outro Usuário",
        owner: "QA",
        startDate: new Date(),
        userId: otherUser.id,
      },
    });

    try {
      const response = await GET(
        new Request("http://localhost", { headers: { Cookie: cookie } }),
        makeContext(otherProject.id),
      );
      expect(response.status).toBe(404);
    } finally {
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });
});
