import { z } from "zod";

import { RISK_CATEGORY, RISK_STATUS } from "@/lib/enums";
import { optionalText, requiredText } from "@/lib/validation/shared";

const scaleField = (label: string) =>
  z.coerce
    .number({ error: `${label} deve ser um número.` })
    .int()
    .min(1, { error: `${label} deve estar entre 1 e 5.` })
    .max(5, { error: `${label} deve estar entre 1 e 5.` });

export const riskSchema = z.object({
  title: requiredText("Título", 200),
  description: optionalText(2000),
  category: z.enum(RISK_CATEGORY),
  probability: scaleField("Probabilidade"),
  impact: scaleField("Impacto"),
  owner: requiredText("Responsável", 200),
  mitigationStrategy: optionalText(2000),
  status: z.enum(RISK_STATUS).default("OPEN"),
});

export type RiskInput = z.input<typeof riskSchema>;
export type RiskValues = z.output<typeof riskSchema>;
