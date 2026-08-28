import type { Prisma } from "@/generated/prisma/client";
import {
  calculateHealthScore,
  type HealthScoreResult,
} from "@/domain/health-score/calculate";
import { prisma } from "@/lib/prisma";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function computeAndSnapshotHealthScore(
  projectId: string,
): Promise<HealthScoreResult> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { milestones: true, dependencies: true, risks: true },
  });

  const result = calculateHealthScore({
    project: {
      startDate: project.startDate,
      endDate: project.endDate,
      progressPercent: project.progressPercent,
      status: project.status,
    },
    milestones: project.milestones,
    dependencies: project.dependencies,
    risks: project.risks,
  });

  const snapshotDate = startOfUtcDay(new Date());
  await prisma.healthScoreSnapshot.upsert({
    where: { projectId_snapshotDate: { projectId, snapshotDate } },
    create: {
      projectId,
      snapshotDate,
      overallScore: result.score,
      breakdown: result as unknown as Prisma.InputJsonValue,
    },
    update: {
      overallScore: result.score,
      breakdown: result as unknown as Prisma.InputJsonValue,
    },
  });

  return result;
}

export async function snapshotAllActiveProjects(): Promise<
  { projectId: string; score: number }[]
> {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const results = [];
  for (const project of projects) {
    const result = await computeAndSnapshotHealthScore(project.id);
    results.push({ projectId: project.id, score: result.score });
  }
  return results;
}
