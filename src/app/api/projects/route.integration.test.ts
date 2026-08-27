// Integration tests that exercise real Route Handlers against a real
// Postgres database (see DATABASE_URL — local `.env` or the CI Postgres
// service). Route Handlers are plain async functions, so we can call them
// directly with a Request object, no HTTP server needed.
import { afterEach, describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/projects/route";
import { prisma } from "@/lib/prisma";

const createdProjectIds: string[] = [];

afterEach(async () => {
  if (createdProjectIds.length > 0) {
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    createdProjectIds.length = 0;
  }
});

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

    const response = await GET();
    const body = await response.json();

    expect(body.some((p: { id: string }) => p.id === created.id)).toBe(false);
  });
});
