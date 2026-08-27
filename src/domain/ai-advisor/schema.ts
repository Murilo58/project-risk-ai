import { z } from "zod";

import { RISK_CATEGORY } from "@/lib/enums";

// Structured output contract for the Claude analysis. Kept intentionally
// small and flat — every field maps directly to something the user reviews
// and can accept/edit/discard. See ARCHITECTURE.md §7 and PRD.md §8.
export const suggestedRiskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(RISK_CATEGORY),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigationStrategy: z.string().min(1).max(1000),
});

export const aiAnalysisSchema = z.object({
  executiveSummary: z.string().min(1).max(2000),
  attentionPoints: z.array(z.string().min(1).max(300)).max(10),
  suggestedRisks: z.array(suggestedRiskSchema).max(10),
});

export type SuggestedRisk = z.infer<typeof suggestedRiskSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
