import { z } from "zod";

import { MILESTONE_STATUS } from "@/lib/enums";
import { optionalDate, requiredDate, requiredText } from "@/lib/validation/shared";

const milestoneObjectSchema = z.object({
  description: requiredText("Descrição", 300),
  plannedDate: requiredDate,
  actualDate: optionalDate,
  status: z.enum(MILESTONE_STATUS),
  owner: requiredText("Responsável", 200),
});

// `.default()` lives only on the create variant. Applying it on the shared
// base schema would make `.partial()` useless for `status` on updates: Zod
// still fills in a default for a field that is absent from a partial
// payload, so an update that omits `status` would silently become
// `status: "PLANNED"` instead of leaving it unset — breaking the
// `effectiveStatus ?? existing.status` fallback below.
const milestoneCreateObjectSchema = milestoneObjectSchema.extend({
  status: z.enum(MILESTONE_STATUS).default("PLANNED"),
});

// A milestone marked "Concluído" must record when it actually finished.
// Non-completed statuses are intentionally NOT required to omit
// actualDate here — the route handlers normalize that server-side (see
// PRD.md rule 3), since a `.partial()` payload may not even mention
// `status`, making that direction unverifiable from the payload alone.
function completedRequiresActualDate(data: { status?: string; actualDate?: Date }) {
  return data.status !== "COMPLETED" || data.actualDate !== undefined;
}
const completedRuleConfig = {
  error: "Marcos concluídos exigem a data realizada.",
  path: ["actualDate"],
};

// Zod does not allow `.partial()` on a schema that already has `.refine()`
// applied (throws at runtime) — see the PATCH /api/projects/:id bug this
// pattern fixed. Keep a plain object schema so both the full (create) and
// partial (update) variants can each apply the rule independently.
export const milestoneSchema = milestoneCreateObjectSchema.refine(
  completedRequiresActualDate,
  completedRuleConfig,
);
export const milestoneUpdateSchema = milestoneObjectSchema
  .partial()
  .refine(completedRequiresActualDate, completedRuleConfig);

export type MilestoneInput = z.input<typeof milestoneSchema>;
export type MilestoneValues = z.output<typeof milestoneSchema>;

// Server-side enforcement of "actualDate stays empty unless Concluído"
// (PRD.md rule 3 / the milestone schedule business rule). `effectiveStatus`
// must account for a status already stored in the database when the
// payload is a partial update that doesn't mention `status` at all —
// otherwise a lone `{ actualDate }` PATCH could sneak a completion date
// onto a milestone that never actually got marked Concluído.
//
// Passing `null` (not `undefined`) is deliberate: Prisma treats `undefined`
// as "leave this column alone" and `null` as "clear it" — going back from
// Concluído to any other status must actively wipe a stale actualDate.
export function withNormalizedActualDate<T extends { actualDate?: Date | null }>(
  data: T,
  effectiveStatus: string,
): T {
  return effectiveStatus === "COMPLETED" ? data : { ...data, actualDate: null };
}
