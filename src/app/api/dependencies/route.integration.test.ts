import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { POST } from "@/app/api/projects/[projectId]/dependencies/route";
import { PATCH, DELETE } from "@/app/api/dependencies/[dependencyId]/route";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { authCookieHeader } from "@/test/auth";

const createdProjectIds: string[] = [];
let testUserId: string;
let cookie: string;

beforeAll(async () => {
  const user = await createUser({
    name: "Usuário de Teste — Dependências",
    email: "dependencies-integration-test@example.com",
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
    data: {
      name: "Integração Dependências",
      owner: "Marina",
      startDate: new Date(),
      userId,
    },
  });
  createdProjectIds.push(project.id);
  return project;
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/x/dependencies", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/dependencies/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function deleteRequest(): Request {
  return new Request("http://localhost/api/dependencies/x", {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
}

function projectContext(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function dependencyContext(dependencyId: string) {
  return { params: Promise.resolve({ dependencyId }) };
}

describe("POST /api/projects/:projectId/dependencies", () => {
  it("creates a dependency for the caller's own project", async () => {
    const project = await createProject();

    const response = await POST(
      postRequest({ description: "Integração com ERP", type: "EXTERNAL", owner: "João" }),
      projectContext(project.id),
    );
    expect(response.status).toBe(201);
  });

  it("returns 404 when the project belongs to a different user (cross-user isolation)", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-dependencies-post@example.com",
      password: "correct-password",
    });
    const otherProject = await createProject(otherUser.id);

    try {
      const response = await POST(
        postRequest({
          description: "Integração com ERP",
          type: "EXTERNAL",
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

describe("PATCH/DELETE /api/dependencies/:dependencyId", () => {
  async function createDependency(project: { id: string }) {
    return prisma.dependency.create({
      data: {
        projectId: project.id,
        description: "Integração com ERP",
        type: "EXTERNAL",
        owner: "João",
      },
    });
  }

  it("updates a dependency owned by the caller", async () => {
    const project = await createProject();
    const dependency = await createDependency(project);

    const response = await PATCH(
      patchRequest({ status: "BLOCKED" }),
      dependencyContext(dependency.id),
    );
    expect(response.status).toBe(200);
  });

  it("returns 404 when the dependency's project belongs to a different user", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-dependencies-patch@example.com",
      password: "correct-password",
    });
    const otherProject = await createProject(otherUser.id);
    const otherDependency = await createDependency(otherProject);

    try {
      const patchResponse = await PATCH(
        patchRequest({ status: "BLOCKED" }),
        dependencyContext(otherDependency.id),
      );
      expect(patchResponse.status).toBe(404);

      const deleteResponse = await DELETE(
        deleteRequest(),
        dependencyContext(otherDependency.id),
      );
      expect(deleteResponse.status).toBe(404);
    } finally {
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });

  it("returns 404 when the dependency's own project has been soft-deleted", async () => {
    const project = await createProject();
    const dependency = await createDependency(project);

    await prisma.project.update({
      where: { id: project.id },
      data: { deletedAt: new Date() },
    });

    const patchResponse = await PATCH(
      patchRequest({ status: "BLOCKED" }),
      dependencyContext(dependency.id),
    );
    expect(patchResponse.status).toBe(404);

    const deleteResponse = await DELETE(
      deleteRequest(),
      dependencyContext(dependency.id),
    );
    expect(deleteResponse.status).toBe(404);

    const stored = await prisma.dependency.findUnique({ where: { id: dependency.id } });
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe("OPEN");
  });
});
