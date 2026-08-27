// Deterministic, explainable Health Score calculation.
// This module must never call an LLM or any non-deterministic source — see
// HEALTH_SCORE.md, which this implementation follows section by section.

import { isRiskOpen } from "@/domain/risks/severity";
import type { Criticality, HealthBand } from "@/lib/enums";

export type HealthScoreMilestone = {
  plannedDate: Date;
  actualDate: Date | null;
  status: string;
};

export type HealthScoreDependency = {
  criticality: Criticality;
  status: string;
};

export type HealthScoreRisk = {
  category: string;
  probability: number;
  impact: number;
  status: string;
  mitigationStrategy: string | null;
};

export type HealthScoreProject = {
  startDate: Date;
  endDate: Date | null;
  progressPercent: number;
};

export type HealthScoreInput = {
  project: HealthScoreProject;
  milestones: HealthScoreMilestone[];
  dependencies: HealthScoreDependency[];
  risks: HealthScoreRisk[];
  /** Injectable "today" so results are reproducible in tests. Defaults to now. */
  referenceDate?: Date;
};

export type DimensionBreakdown = {
  penalty: number;
  maxPenalty: number;
  score: number;
  band: HealthBand;
  notes: string[];
};

export type HealthScoreResult = {
  score: number;
  band: HealthBand;
  dimensions: {
    schedule: DimensionBreakdown;
    risks: DimensionBreakdown;
    dependencies: DimensionBreakdown;
    scope: DimensionBreakdown;
    resources: DimensionBreakdown;
  };
};

const MAX_PENALTY = {
  risks: 30,
  schedule: 25,
  dependencies: 20,
  scope: 15,
  resources: 10,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function classify(score: number): HealthBand {
  if (score >= 90) return "HEALTHY";
  if (score >= 75) return "ATTENTION";
  if (score >= 60) return "RISK";
  return "CRITICAL";
}

function dimension(
  penalty: number,
  maxPenalty: number,
  notes: string[],
): DimensionBreakdown {
  const capped = Math.min(penalty, maxPenalty);
  const score = Math.round(100 - (capped / maxPenalty) * 100);
  return { penalty: round2(capped), maxPenalty, score, band: classify(score), notes };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// --- Risks (HEALTH_SCORE.md §3) --------------------------------------------

const RISK_BASE_PENALTY: Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL", number> = {
  LOW: 0.5,
  MEDIUM: 1.5,
  HIGH: 3.5,
  CRITICAL: 6.0,
};

function riskSeverityBand(severity: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (severity >= 16) return "CRITICAL";
  if (severity >= 10) return "HIGH";
  if (severity >= 5) return "MEDIUM";
  return "LOW";
}

function riskPenalty(risk: HealthScoreRisk): number {
  const severity = risk.probability * risk.impact;
  const base = RISK_BASE_PENALTY[riskSeverityBand(severity)];
  const hasNoMitigation =
    !risk.mitigationStrategy || risk.mitigationStrategy.trim() === "";
  return hasNoMitigation ? base * 1.5 : base;
}

function calculateRiskDimension(
  risks: HealthScoreRisk[],
  categories: string[],
  maxPenalty: number,
  label: string,
): DimensionBreakdown {
  const relevant = risks.filter(
    (risk) => isRiskOpen(risk.status) && categories.includes(risk.category),
  );
  const notes = relevant.map((risk) => {
    const severity = risk.probability * risk.impact;
    const penalty = riskPenalty(risk);
    const mitigationNote = risk.mitigationStrategy?.trim()
      ? "com mitigação"
      : "sem mitigação";
    return `Risco ${label.toLowerCase()} (severidade ${severity}, ${mitigationNote}): -${round2(penalty)}`;
  });
  const totalPenalty = relevant.reduce((sum, risk) => sum + riskPenalty(risk), 0);
  return dimension(totalPenalty, maxPenalty, notes);
}

// --- Schedule (HEALTH_SCORE.md §4) ------------------------------------------

export function isMilestoneLate(
  milestone: HealthScoreMilestone,
  referenceDate: Date,
): boolean {
  if (milestone.status === "CANCELLED") return false;
  if (milestone.actualDate) return milestone.actualDate > milestone.plannedDate;
  return milestone.status !== "COMPLETED" && milestone.plannedDate < referenceDate;
}

function milestoneDelayPenalty(
  milestone: HealthScoreMilestone,
  referenceDate: Date,
): number {
  const comparisonDate = milestone.actualDate ?? referenceDate;
  const daysLate = Math.max(
    0,
    (comparisonDate.getTime() - milestone.plannedDate.getTime()) / DAY_MS,
  );
  return Math.min(5, (daysLate / 7) * 1.5);
}

function calculateScheduleDimension(
  project: HealthScoreProject,
  milestones: HealthScoreMilestone[],
  referenceDate: Date,
): DimensionBreakdown {
  const notes: string[] = [];

  const lateMilestones = milestones.filter((m) => isMilestoneLate(m, referenceDate));
  const delayPenalty = Math.min(
    15,
    lateMilestones.reduce((sum, m) => sum + milestoneDelayPenalty(m, referenceDate), 0),
  );
  if (lateMilestones.length > 0) {
    notes.push(
      `${lateMilestones.length} marco(s) atrasado(s): -${round2(delayPenalty)} (máx. 15)`,
    );
  }

  let progressPenalty = 0;
  if (project.endDate) {
    const totalDays = (project.endDate.getTime() - project.startDate.getTime()) / DAY_MS;
    const elapsedDays = (referenceDate.getTime() - project.startDate.getTime()) / DAY_MS;
    if (totalDays > 0) {
      const expectedProgress = Math.min(
        100,
        Math.max(0, (elapsedDays / totalDays) * 100),
      );
      const gap = Math.max(0, expectedProgress - project.progressPercent);
      progressPenalty = Math.min(10, gap / 5);
      if (gap > 0) {
        notes.push(
          `Progresso ${project.progressPercent}% vs. esperado ${Math.round(expectedProgress)}%: -${round2(progressPenalty)} (máx. 10)`,
        );
      }
    }
  } else {
    notes.push("Prazo final não definido — fator de progresso esperado não avaliado.");
  }

  return dimension(delayPenalty + progressPenalty, MAX_PENALTY.schedule, notes);
}

// --- Dependencies (HEALTH_SCORE.md §5) --------------------------------------

const DEPENDENCY_BASE_PENALTY: Record<Criticality, number> = {
  LOW: 1,
  MEDIUM: 3,
  HIGH: 6,
  CRITICAL: 10,
};

function calculateDependencyDimension(
  dependencies: HealthScoreDependency[],
): DimensionBreakdown {
  const openDependencies = dependencies.filter(
    (dependency) => dependency.status !== "RESOLVED" && dependency.status !== "CANCELLED",
  );
  const notes = openDependencies.map((dependency) => {
    const base = DEPENDENCY_BASE_PENALTY[dependency.criticality];
    const penalty = dependency.status === "BLOCKED" ? base * 1.5 : base;
    return `Dependência ${dependency.criticality.toLowerCase()}${dependency.status === "BLOCKED" ? " bloqueada" : ""}: -${round2(penalty)}`;
  });
  const totalPenalty = openDependencies.reduce((sum, dependency) => {
    const base = DEPENDENCY_BASE_PENALTY[dependency.criticality];
    return sum + (dependency.status === "BLOCKED" ? base * 1.5 : base);
  }, 0);
  return dimension(totalPenalty, MAX_PENALTY.dependencies, notes);
}

// --- Overall -----------------------------------------------------------------

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const referenceDate = input.referenceDate ?? new Date();

  const schedule = calculateScheduleDimension(
    input.project,
    input.milestones,
    referenceDate,
  );
  const dependencies = calculateDependencyDimension(input.dependencies);
  const risks = calculateRiskDimension(
    input.risks,
    [
      "SCHEDULE",
      "TECHNOLOGY",
      "EXTERNAL_DEPENDENCY",
      "VENDOR",
      "INTEGRATION",
      "QUALITY",
      "BUSINESS",
      "OTHER",
    ],
    MAX_PENALTY.risks,
    "geral",
  );
  const scope = calculateRiskDimension(
    input.risks,
    ["SCOPE"],
    MAX_PENALTY.scope,
    "de escopo",
  );
  const resources = calculateRiskDimension(
    input.risks,
    ["RESOURCES"],
    MAX_PENALTY.resources,
    "de recursos",
  );

  const totalPenalty =
    schedule.penalty +
    risks.penalty +
    dependencies.penalty +
    scope.penalty +
    resources.penalty;
  const score = Math.max(0, Math.round(100 - totalPenalty));

  return {
    score,
    band: classify(score),
    dimensions: { schedule, risks, dependencies, scope, resources },
  };
}
