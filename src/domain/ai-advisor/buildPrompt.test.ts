import { describe, expect, it } from "vitest";

import { calculateHealthScore } from "@/domain/health-score/calculate";
import { buildPrompt } from "@/domain/ai-advisor/buildPrompt";

const project = {
  name: "Migração ERP",
  description: "Migração do ERP legado.",
  owner: "Marina Silva",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-06-01"),
  status: "IN_PROGRESS" as const,
  progressPercent: 30,
  teamSize: 8,
  criticality: "HIGH" as const,
  notes: null,
};

const healthScore = calculateHealthScore({
  project,
  milestones: [],
  dependencies: [],
  risks: [],
  referenceDate: new Date("2026-02-01"),
});

describe("buildPrompt", () => {
  it("includes the project name, owner, and health score", () => {
    const prompt = buildPrompt({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      healthScore,
    });

    expect(prompt).toContain("Migração ERP");
    expect(prompt).toContain("Marina Silva");
    expect(prompt).toContain(`${healthScore.score}/100`);
  });

  it("lists already-registered risks so the model does not repeat them", () => {
    const prompt = buildPrompt({
      project,
      milestones: [],
      dependencies: [],
      risks: [
        {
          title: "Atraso na integração de pagamentos",
          category: "EXTERNAL_DEPENDENCY",
          probability: 4,
          impact: 5,
          severity: 20,
          status: "OPEN",
          mitigationStrategy: null,
        },
      ],
      healthScore,
    });

    expect(prompt).toContain("Atraso na integração de pagamentos");
    expect(prompt).toContain("severidade 20");
  });

  it("states explicitly when there are no milestones or dependencies", () => {
    const prompt = buildPrompt({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      healthScore,
    });

    expect(prompt).toContain("Nenhum marco cadastrado.");
    expect(prompt).toContain("Nenhuma dependência cadastrada.");
  });
});
