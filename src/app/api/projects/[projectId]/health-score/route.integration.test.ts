// Integration test: create a real project + risk, then verify the
// Health Score route reflects it and persists a snapshot — exercising the
// Route Handler, the domain engine, and Prisma together.
import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/projects/[projectId]/health-score/route";
import { prisma } from "@/lib/prisma";

let projectId: string | null = null;

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
      data: { name: "Projeto com Risco Crítico", owner: "QA", startDate: new Date() },
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

    const response = await GET(new Request("http://localhost"), makeContext(project.id));
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
      new Request("http://localhost"),
      makeContext("nonexistent-id"),
    );
    expect(response.status).toBe(404);
  });
});
