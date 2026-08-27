import { z } from "zod";

import { MILESTONE_STATUS } from "@/lib/enums";
import { optionalDate, requiredDate, requiredText } from "@/lib/validation/shared";

export const milestoneSchema = z.object({
  description: requiredText("Descrição", 300),
  plannedDate: requiredDate,
  actualDate: optionalDate,
  status: z.enum(MILESTONE_STATUS).default("PLANNED"),
  owner: requiredText("Responsável", 200),
});

export type MilestoneInput = z.input<typeof milestoneSchema>;
export type MilestoneValues = z.output<typeof milestoneSchema>;
