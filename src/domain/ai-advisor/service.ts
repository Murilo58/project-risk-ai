import { buildPrompt } from "@/domain/ai-advisor/buildPrompt";
import { runAiAnalysis } from "@/domain/ai-advisor/claudeClient";
import { calculateHealthScore } from "@/domain/health-score/calculate";
import { isRiskOpen } from "@/domain/risks/severity";
import { NotFoundError } from "@/lib/api-errors";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 5 * 60 * 1000;

export class AiAdvisorCooldownError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(
      `Aguarde ${retryAfterSeconds}s antes de solicitar uma nova análise para este projeto.`,
    );
    this.name = "AiAdvisorCooldownError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function assertCooldownElapsed(projectId: string) {
  const lastSuggestion = await prisma.aiSuggestion.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!lastSuggestion) return;

  const elapsed = Date.now() - lastSuggestion.createdAt.getTime();
  if (elapsed < COOLDOWN_MS) {
    throw new AiAdvisorCooldownError(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
  }
}

export async function requestAiAnalysis(projectId: string) {
  await assertCooldownElapsed(projectId);

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { milestones: true, dependencies: true, risks: true },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");

  const healthScore = calculateHealthScore({
    project: {
      startDate: project.startDate,
      endDate: project.endDate,
      progressPercent: project.progressPercent,
    },
    milestones: project.milestones,
    dependencies: project.dependencies,
    risks: project.risks,
  });

  const openRisks = project.risks.filter((risk) => isRiskOpen(risk.status));

  const prompt = buildPrompt({
    project,
    milestones: project.milestones,
    dependencies: project.dependencies,
    risks: openRisks,
    healthScore,
  });

  const analysis = await runAiAnalysis(prompt);

  const suggestions = await prisma.$transaction([
    prisma.aiSuggestion.create({
      data: {
        projectId,
        type: "EXECUTIVE_SUMMARY",
        content: {
          summary: analysis.executiveSummary,
          attentionPoints: analysis.attentionPoints,
        } as unknown as Prisma.InputJsonValue,
        status: "PENDING",
      },
    }),
    ...analysis.suggestedRisks.map((risk) =>
      prisma.aiSuggestion.create({
        data: {
          projectId,
          type: "RISK",
          content: risk as unknown as Prisma.InputJsonValue,
          status: "PENDING",
        },
      }),
    ),
  ]);

  return suggestions;
}

export async function listSuggestions(projectId: string) {
  return prisma.aiSuggestion.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function decideSuggestion(
  suggestionId: string,
  status: "ACCEPTED" | "DISMISSED",
) {
  const suggestion = await prisma.aiSuggestion.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) throw new NotFoundError("Sugestão não encontrada.");

  return prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { status },
  });
}
