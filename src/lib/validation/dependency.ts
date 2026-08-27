import { z } from "zod";

import { CRITICALITY, DEPENDENCY_STATUS, DEPENDENCY_TYPE } from "@/lib/enums";
import { requiredText } from "@/lib/validation/shared";

export const dependencySchema = z.object({
  description: requiredText("Descrição", 300),
  type: z.enum(DEPENDENCY_TYPE),
  owner: requiredText("Responsável", 200),
  criticality: z.enum(CRITICALITY).default("MEDIUM"),
  status: z.enum(DEPENDENCY_STATUS).default("OPEN"),
});

export type DependencyInput = z.input<typeof dependencySchema>;
export type DependencyValues = z.output<typeof dependencySchema>;
