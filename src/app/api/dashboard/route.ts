import { calculateHealthScore, isMilestoneLate } from "@/domain/health-score/calculate";
import { isRiskOpen, severityBand } from "@/domain/risks/severity";
import { toErrorResponse } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import type { HealthBand } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireSession(request);

    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: { milestones: true, dependencies: true, risks: true },
      orderBy: { createdAt: "desc" },
    });

    const summary: Record<HealthBand, number> = {
      HEALTHY: 0,
      ATTENTION: 0,
      RISK: 0,
      CRITICAL: 0,
    };

    let criticalOpenRisks = 0;
    let delayedMilestones = 0;
    const now = new Date();

    const projectSummaries = projects.map((project) => {
      const result = calculateHealthScore({
        project: {
          startDate: project.startDate,
          endDate: project.endDate,
          progressPercent: project.progressPercent,
        },
        milestones: project.milestones,
        dependencies: project.dependencies,
        risks: project.risks,
        referenceDate: now,
      });

      summary[result.band] += 1;

      for (const risk of project.risks) {
        if (isRiskOpen(risk.status) && severityBand(risk.severity) === "CRITICAL") {
          criticalOpenRisks += 1;
        }
      }
      for (const milestone of project.milestones) {
        if (isMilestoneLate(milestone, now)) delayedMilestones += 1;
      }

      return {
        id: project.id,
        name: project.name,
        owner: project.owner,
        criticality: project.criticality,
        status: project.status,
        score: result.score,
        band: result.band,
      };
    });

    projectSummaries.sort((a, b) => a.score - b.score);

    return Response.json({
      summary,
      criticalOpenRisks,
      delayedMilestones,
      projects: projectSummaries,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
