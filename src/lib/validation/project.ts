import { z } from "zod";

import { CRITICALITY, PROJECT_STATUS } from "@/lib/enums";
import {
  optionalDate,
  optionalText,
  requiredDate,
  requiredText,
} from "@/lib/validation/shared";

export const projectSchema = z
  .object({
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
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    error: "A data prevista de término não pode ser anterior à data de início.",
    path: ["endDate"],
  });

export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectValues = z.output<typeof projectSchema>;
