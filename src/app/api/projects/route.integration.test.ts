// Integration tests that exercise real Route Handlers against a real
// Postgres database (see DATABASE_URL — local `.env` or the CI Postgres
// service). Route Handlers are plain async functions, so we can call them
// directly with a Request object, no HTTP server needed.
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/projects/route";
import { PATCH } from "@/app/api/projects/[projectId]/route";
import { prisma } from "@/lib/prisma";
import { authCookieHeader } from "@/test/auth";

const createdProjectIds: string[] = [];
let cookie: string;

beforeAll(async () => {
  cookie = await authCookieHeader();
});

afterEach(async () => {
  if (createdProjectIds.length > 0) {
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    createdProjectIds.length = 0;
  }
});

function getRequest(): Request {
  return new Request("http://localhost/api/projects", { headers: { Cookie: cookie } });
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

function makeContext(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe("POST /api/projects", () => {
  it("creates a project and persists it", async () => {
    const response = await POST(
      postRequest({
        name: "Projeto de Integração",
        owner: "Equipe QA",
        startDate: "2026-01-01",
      }),
    );
    expect(response.status).toBe(201);

    const body = await response.json();
    createdProjectIds.push(body.id);

    expect(body.name).toBe("Projeto de Integração");
    expect(body.status).toBe("PLANNED");

    const stored = await prisma.project.findUnique({ where: { id: body.id } });
    expect(stored).not.toBeNull();
    expect(stored?.owner).toBe("Equipe QA");
  });

  it("returns 400 and does not persist anything when validation fails", async () => {
    const before = await prisma.project.count();

    const response = await POST(postRequest({ owner: "Sem nome" }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "name" })]),
    );

    const after = await prisma.project.count();
    expect(after).toBe(before);
  });
});

describe("PATCH /api/projects/:id", () => {
  async function createProject() {
    const project = await prisma.project.create({
      data: {
        name: "Integração Meios de Pagamento",
        owner: "Marina",
        startDate: new Date("2026-01-10"),
        status: "IN_PROGRESS",
        criticality: "HIGH",
      },
    });
    createdProjectIds.push(project.id);
    return project;
  }

  it("updates a project with a partial payload (regression: projectSchema.partial() + .refine())", async () => {
    const project = await createProject();

    const response = await PATCH(
      patchRequest({ progressPercent: 40 }),
      makeContext(project.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.progressPercent).toBe(40);
    expect(body.name).toBe(project.name);

    const stored = await prisma.project.findUnique({ where: { id: project.id } });
    expect(stored?.progressPercent).toBe(40);
  });

  it("updates every field like the edit form does", async () => {
    const project = await createProject();

    const response = await PATCH(
      patchRequest({
        name: project.name,
        owner: project.owner,
        startDate: "2026-01-10",
        endDate: "2026-06-30",
        status: "ON_HOLD",
        progressPercent: 55,
        criticality: "CRITICAL",
      }),
      makeContext(project.id),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ON_HOLD");
    expect(body.criticality).toBe("CRITICAL");
    expect(body.progressPercent).toBe(55);
  });

  it("still rejects an end date before the start date on partial update", async () => {
    const project = await createProject();

    const response = await PATCH(
      patchRequest({ startDate: "2026-06-01", endDate: "2026-01-01" }),
      makeContext(project.id),
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 for a project that does not exist", async () => {
    const response = await PATCH(
      patchRequest({ progressPercent: 10 }),
      makeContext("nope"),
    );
    expect(response.status).toBe(404);
  });
});

describe("GET /api/projects", () => {
  it("excludes soft-deleted projects from the listing", async () => {
    const created = await prisma.project.create({
      data: {
        name: "Projeto Removido",
        owner: "QA",
        startDate: new Date(),
        deletedAt: new Date(),
      },
    });
    createdProjectIds.push(created.id);

    const response = await GET(getRequest());
    const body = await response.json();

    expect(body.some((p: { id: string }) => p.id === created.id)).toBe(false);
  });

  it("returns 401 without a valid session", async () => {
    const response = await GET(new Request("http://localhost/api/projects"));
    expect(response.status).toBe(401);
  });
});
