import { z } from "zod";

import { CRITICALITY, PROJECT_STATUS } from "@/lib/enums";
import {
  optionalDate,
  optionalText,
  requiredDate,
  requiredText,
} from "@/lib/validation/shared";

const projectObjectSchema = z.object({
  name: requiredText("Nome", 200),
  description: optionalText(2000),
  owner: requiredText("Responsável", 200),
  startDate: requiredDate,
  endDate: optionalDate,
  status: z.enum(PROJECT_STATUS).default("PLANNED"),
  progressPercent: z.coerce
    .number({ error: "Progresso deve ser um número." })
    .int()
    .min(0, { error: "Progresso não pode ser menor que 0." })
    .max(100, { error: "Progresso não pode ser maior que 100." })
    .default(0),
  teamSize: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : value,
    z.coerce
      .number({ error: "Tamanho da equipe deve ser um número." })
      .int()
      .positive({ error: "Tamanho da equipe deve ser positivo." })
      .optional(),
  ),
  criticality: z.enum(CRITICALITY).default("MEDIUM"),
  notes: optionalText(4000),
});

// endDate must never precede startDate — applied both on full creation and
// on partial updates (the edit form always resubmits every field, so both
// dates are present in practice even though the update schema is `.partial()`).
function endDateNotBeforeStartDate(data: { startDate?: Date; endDate?: Date }) {
  return !data.endDate || !data.startDate || data.endDate >= data.startDate;
}
const endDateRuleConfig = {
  error: "A data prevista de término não pode ser anterior à data de início.",
  path: ["endDate"],
};

// Zod does not allow `.partial()` on a schema that already has `.refine()`
// applied (it throws at runtime — see the PATCH route bug this fixed).
// Keep a plain object schema around so both the full (create) and partial
// (update) variants can each apply the cross-field date rule independently.
export const projectSchema = projectObjectSchema.refine(
  endDateNotBeforeStartDate,
  endDateRuleConfig,
);
export const projectUpdateSchema = projectObjectSchema
  .partial()
  .refine(endDateNotBeforeStartDate, endDateRuleConfig);

export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectValues = z.output<typeof projectSchema>;
