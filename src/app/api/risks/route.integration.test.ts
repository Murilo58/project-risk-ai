import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { POST } from "@/app/api/projects/[projectId]/risks/route";
import { PATCH, DELETE } from "@/app/api/risks/[riskId]/route";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { authCookieHeader } from "@/test/auth";

const createdProjectIds: string[] = [];
let testUserId: string;
let cookie: string;

beforeAll(async () => {
  const user = await createUser({
    name: "Usuário de Teste — Riscos",
    email: "risks-integration-test@example.com",
    password: "correct-password",
  });
  testUserId = user.id;
  cookie = await authCookieHeader(testUserId);
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: testUserId } });
});

afterEach(async () => {
  if (createdProjectIds.length > 0) {
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    createdProjectIds.length = 0;
  }
});

async function createProject(userId: string = testUserId) {
  const project = await prisma.project.create({
    data: { name: "Integração Riscos", owner: "Marina", startDate: new Date(), userId },
  });
  createdProjectIds.push(project.id);
  return project;
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/x/risks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/risks/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function deleteRequest(): Request {
  return new Request("http://localhost/api/risks/x", {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
}

function projectContext(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function riskContext(riskId: string) {
  return { params: Promise.resolve({ riskId }) };
}

describe("POST /api/projects/:projectId/risks", () => {
  it("creates a risk for the caller's own project", async () => {
    const project = await createProject();

    const response = await POST(
      postRequest({
        title: "Atraso de fornecedor",
        category: "EXTERNAL_DEPENDENCY",
        probability: 3,
        impact: 4,
        owner: "João",
      }),
      projectContext(project.id),
    );
    expect(response.status).toBe(201);
  });

  it("returns 404 when the project belongs to a different user (cross-user isolation)", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-risks-post@example.com",
      password: "correct-password",
    });
    const otherProject = await createProject(otherUser.id);

    try {
      const response = await POST(
        postRequest({
          title: "Atraso de fornecedor",
          category: "EXTERNAL_DEPENDENCY",
          probability: 3,
          impact: 4,
          owner: "João",
        }),
        projectContext(otherProject.id),
      );
      expect(response.status).toBe(404);
    } finally {
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });
});

describe("PATCH/DELETE /api/risks/:riskId", () => {
  async function createRisk(project: { id: string }) {
    return prisma.risk.create({
      data: {
        projectId: project.id,
        title: "Atraso de fornecedor",
        category: "EXTERNAL_DEPENDENCY",
        probability: 3,
        impact: 4,
        severity: 12,
        owner: "João",
      },
    });
  }

  it("updates a risk owned by the caller", async () => {
    const project = await createProject();
    const risk = await createRisk(project);

    const response = await PATCH(
      patchRequest({ status: "MITIGATED" }),
      riskContext(risk.id),
    );
    expect(response.status).toBe(200);
  });

  it("returns 404 when the risk's project belongs to a different user", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-risks-patch@example.com",
      password: "correct-password",
    });
    const otherProject = await createProject(otherUser.id);
    const otherRisk = await createRisk(otherProject);

    try {
      const patchResponse = await PATCH(
        patchRequest({ status: "MITIGATED" }),
        riskContext(otherRisk.id),
      );
      expect(patchResponse.status).toBe(404);

      const deleteResponse = await DELETE(deleteRequest(), riskContext(otherRisk.id));
      expect(deleteResponse.status).toBe(404);
    } finally {
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });

  it("returns 404 when the risk's own project has been soft-deleted", async () => {
    const project = await createProject();
    const risk = await createRisk(project);

    await prisma.project.update({
      where: { id: project.id },
      data: { deletedAt: new Date() },
    });

    const patchResponse = await PATCH(
      patchRequest({ status: "MITIGATED" }),
      riskContext(risk.id),
    );
    expect(patchResponse.status).toBe(404);

    const deleteResponse = await DELETE(deleteRequest(), riskContext(risk.id));
    expect(deleteResponse.status).toBe(404);

    const stored = await prisma.risk.findUnique({ where: { id: risk.id } });
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe("OPEN");
  });
});
