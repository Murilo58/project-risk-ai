// Covers the cron entry point (snapshotAllActiveProjects) explicitly
// ignoring soft-deleted projects — the same guarantee already relied on by
// GET /api/projects/:id/health-score, verified here at the portfolio-wide
// batch level used by /api/cron/health-snapshot.
import { afterEach, describe, expect, it } from "vitest";

import { snapshotAllActiveProjects } from "@/domain/health-score/service";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";

const createdProjectIds: string[] = [];
const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdProjectIds.length > 0) {
    await prisma.healthScoreSnapshot.deleteMany({
      where: { projectId: { in: createdProjectIds } },
    });
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    createdProjectIds.length = 0;
  }
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

describe("snapshotAllActiveProjects", () => {
  it("skips soft-deleted projects but snapshots active ones", async () => {
    const user = await createUser({
      name: "Usuário de Teste — Cron",
      email: "health-score-cron-integration-test@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    const active = await prisma.project.create({
      data: {
        name: "Projeto Ativo",
        owner: "QA",
        startDate: new Date(),
        userId: user.id,
      },
    });
    createdProjectIds.push(active.id);

    const deleted = await prisma.project.create({
      data: {
        name: "Projeto Excluído",
        owner: "QA",
        startDate: new Date(),
        userId: user.id,
        deletedAt: new Date(),
      },
    });
    createdProjectIds.push(deleted.id);

    const results = await snapshotAllActiveProjects();
    const snapshottedIds = results.map((r) => r.projectId);

    expect(snapshottedIds).toContain(active.id);
    expect(snapshottedIds).not.toContain(deleted.id);
  });
});
