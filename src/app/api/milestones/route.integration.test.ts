// Integration tests that exercise real Route Handlers against a real
// Postgres database (see DATABASE_URL — local `.env` or the CI Postgres
// service). Route Handlers are plain async functions, so we can call them
// directly with a Request object, no HTTP server needed.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { POST } from "@/app/api/projects/[projectId]/milestones/route";
import { PATCH } from "@/app/api/milestones/[milestoneId]/route";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { authCookieHeader } from "@/test/auth";

const createdProjectIds: string[] = [];
let testUserId: string;
let cookie: string;

beforeAll(async () => {
  const user = await createUser({
    name: "Usuário de Teste — Marcos",
    email: "milestones-integration-test@example.com",
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

async function createProject() {
  const project = await prisma.project.create({
    data: {
      name: "Integração Marcos",
      owner: "Marina",
      startDate: new Date("2026-01-01"),
      status: "IN_PROGRESS",
      criticality: "MEDIUM",
      userId: testUserId,
    },
  });
  createdProjectIds.push(project.id);
  return project;
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/x/milestones", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/milestones/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function projectContext(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function milestoneContext(milestoneId: string) {
  return { params: Promise.resolve({ milestoneId }) };
}

describe("POST /api/projects/:projectId/milestones", () => {
  it("rejects status COMPLETED without an actual date", async () => {
    const project = await createProject();

    const response = await POST(
      postRequest({
        description: "Entrega piloto",
        plannedDate: "2026-02-01",
        owner: "João",
        status: "COMPLETED",
      }),
      projectContext(project.id),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 without a valid session", async () => {
    const project = await createProject();

    const response = await POST(
      new Request("http://localhost/api/projects/x/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Entrega piloto",
          plannedDate: "2026-02-01",
          owner: "João",
        }),
      }),
      projectContext(project.id),
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the project belongs to a different user (cross-user isolation)", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-milestones-post@example.com",
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
      const response = await POST(
        postRequest({
          description: "Entrega piloto",
          plannedDate: "2026-02-01",
          owner: "João",
        }),
        projectContext(otherProject.id),
      );
      expect(response.status).toBe(404);
    } finally {
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });
});

describe("PATCH /api/milestones/:milestoneId — scenario G", () => {
  async function createMilestone(project: { id: string }) {
    return prisma.milestone.create({
      data: {
        projectId: project.id,
        description: "Entrega piloto",
        plannedDate: new Date("2026-02-01"),
        actualDate: new Date("2026-02-03"),
        status: "COMPLETED",
        owner: "João",
      },
    });
  }

  it("clears actualDate when status moves away from COMPLETED", async () => {
    const project = await createProject();
    const milestone = await createMilestone(project);

    const response = await PATCH(
      patchRequest({ status: "IN_PROGRESS" }),
      milestoneContext(milestone.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("IN_PROGRESS");
    expect(body.actualDate).toBeNull();

    const stored = await prisma.milestone.findUnique({ where: { id: milestone.id } });
    expect(stored?.actualDate).toBeNull();
  });

  it("does not let a lone actualDate payload sneak a completion date onto a non-completed milestone", async () => {
    const project = await createProject();
    const milestone = await prisma.milestone.create({
      data: {
        projectId: project.id,
        description: "Entrega piloto",
        plannedDate: new Date("2026-02-01"),
        status: "PLANNED",
        owner: "João",
      },
    });

    const response = await PATCH(
      patchRequest({ actualDate: "2026-02-01" }),
      milestoneContext(milestone.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("PLANNED");
    expect(body.actualDate).toBeNull();
  });

  it("keeps actualDate when a partial update leaves status as COMPLETED", async () => {
    const project = await createProject();
    const milestone = await createMilestone(project);

    const response = await PATCH(
      patchRequest({ owner: "Nova Responsável" }),
      milestoneContext(milestone.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.owner).toBe("Nova Responsável");
    expect(body.actualDate).not.toBeNull();
  });

  it("returns 404 when the milestone's project belongs to a different user (cross-user isolation)", async () => {
    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-milestones-patch@example.com",
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
    const otherMilestone = await createMilestone(otherProject);

    try {
      const response = await PATCH(
        patchRequest({ owner: "Tentativa Indevida" }),
        milestoneContext(otherMilestone.id),
      );
      expect(response.status).toBe(404);
    } finally {
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });

  it("returns 404 when the milestone's own project has been soft-deleted", async () => {
    const project = await createProject();
    const milestone = await createMilestone(project);

    await prisma.project.update({
      where: { id: project.id },
      data: { deletedAt: new Date() },
    });

    const response = await PATCH(
      patchRequest({ owner: "Tentativa Após Exclusão" }),
      milestoneContext(milestone.id),
    );
    expect(response.status).toBe(404);

    const stored = await prisma.milestone.findUnique({ where: { id: milestone.id } });
    expect(stored?.owner).toBe("João");
  });
});
