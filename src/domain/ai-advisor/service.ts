import { buildPrompt } from "@/domain/ai-advisor/buildPrompt";
import { runAiAnalysis } from "@/domain/ai-advisor/claudeClient";
import { calculateHealthScore } from "@/domain/health-score/calculate";
import { isRiskOpen } from "@/domain/risks/severity";
import { NotFoundError } from "@/lib/api-errors";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 5 * 60 * 1000;

// Per-project cooldown alone doesn't protect against a single user spamming
// several different projects in a row — this second, per-user limit caps
// total Anthropic API spend regardless of how many projects one account
// has. Counting EXECUTIVE_SUMMARY rows (exactly one is created per call to
// requestAiAnalysis) gives an accurate "N analyses" count without needing a
// separate usage-tracking table.
const USER_DAILY_ANALYSIS_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

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

export class AiAdvisorRateLimitError extends Error {
  constructor() {
    super("Limite diário de análises de IA atingido. Tente novamente amanhã.");
    this.name = "AiAdvisorRateLimitError";
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

async function assertUserRateLimitNotExceeded(userId: string) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.aiSuggestion.count({
    where: { type: "EXECUTIVE_SUMMARY", createdAt: { gte: since }, project: { userId } },
  });
  if (count >= USER_DAILY_ANALYSIS_LIMIT) {
    throw new AiAdvisorRateLimitError();
  }
}

export async function requestAiAnalysis(projectId: string, userId: string) {
  await assertUserRateLimitNotExceeded(userId);
  await assertCooldownElapsed(projectId);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
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

export async function listSuggestions(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");

  return prisma.aiSuggestion.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function decideSuggestion(
  suggestionId: string,
  userId: string,
  status: "ACCEPTED" | "DISMISSED",
) {
  const suggestion = await prisma.aiSuggestion.findFirst({
    where: { id: suggestionId, project: { userId } },
  });
  if (!suggestion) throw new NotFoundError("Sugestão não encontrada.");

  return prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { status },
  });
}
