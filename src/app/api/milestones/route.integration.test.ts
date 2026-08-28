// Integration tests that exercise real Route Handlers against a real
// Postgres database (see DATABASE_URL — local `.env` or the CI Postgres
// service). Route Handlers are plain async functions, so we can call them
// directly with a Request object, no HTTP server needed.
import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/projects/[projectId]/milestones/route";
import { PATCH } from "@/app/api/milestones/[milestoneId]/route";
import { prisma } from "@/lib/prisma";

const createdProjectIds: string[] = [];

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
    },
  });
  createdProjectIds.push(project.id);
  return project;
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/x/milestones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/milestones/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
});
