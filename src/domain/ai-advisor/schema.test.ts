import { describe, expect, it } from "vitest";

import { aiAnalysisSchema } from "@/domain/ai-advisor/schema";

const validAnalysis = {
  executiveSummary:
    "O projeto apresenta sinais de atraso combinados com dependência crítica.",
  attentionPoints: ["Dependência externa bloqueada há 2 semanas."],
  suggestedRisks: [
    {
      title: "Atraso na implantação",
      description: "Combinação de marco atrasado e dependência bloqueada.",
      category: "SCHEDULE",
      probability: 4,
      impact: 4,
      mitigationStrategy: "Criar checkpoint semanal com o fornecedor.",
    },
  ],
};

describe("aiAnalysisSchema", () => {
  it("accepts a well-formed analysis", () => {
    expect(aiAnalysisSchema.safeParse(validAnalysis).success).toBe(true);
  });

  it("rejects a suggested risk with an invalid category", () => {
    const invalid = {
      ...validAnalysis,
      suggestedRisks: [{ ...validAnalysis.suggestedRisks[0], category: "MADE_UP" }],
    };
    expect(aiAnalysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects probability/impact outside 1-5", () => {
    const invalid = {
      ...validAnalysis,
      suggestedRisks: [{ ...validAnalysis.suggestedRisks[0], probability: 6 }],
    };
    expect(aiAnalysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts an empty suggestedRisks list (no forced suggestions)", () => {
    const result = aiAnalysisSchema.safeParse({ ...validAnalysis, suggestedRisks: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a missing executive summary", () => {
    const rest: Partial<typeof validAnalysis> = { ...validAnalysis };
    delete rest.executiveSummary;
    expect(aiAnalysisSchema.safeParse(rest).success).toBe(false);
  });
});
