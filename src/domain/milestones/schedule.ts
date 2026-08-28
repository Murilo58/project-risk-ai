// Single source of truth for "is this milestone late" — shared by the
// Health Score engine, the executive dashboard, and the UI table/badge, so
// the three can never disagree with each other. See the business rule
// discussion around this file's introduction: a milestone that is not
// "Concluído" must never have its actualDate considered for lateness, even
// if one happens to be stored (legacy/inconsistent data).

export type MilestoneScheduleInput = {
  status: string;
  plannedDate: Date;
  actualDate: Date | null;
};

export type MilestoneScheduleStatus =
  "ON_TRACK" | "LATE" | "COMPLETED_ON_TIME" | "COMPLETED_LATE";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function classifyMilestoneSchedule(
  milestone: MilestoneScheduleInput,
  referenceDate: Date,
): MilestoneScheduleStatus {
  if (milestone.status === "CANCELLED") return "ON_TRACK";

  if (milestone.status === "COMPLETED") {
    return milestone.actualDate && milestone.actualDate > milestone.plannedDate
      ? "COMPLETED_LATE"
      : "COMPLETED_ON_TIME";
  }

  // Not completed: actualDate (if any — e.g. legacy inconsistent data) is
  // never considered. Compare at day granularity so "planned for today"
  // isn't already late a few hours into the day.
  return milestone.plannedDate < startOfUtcDay(referenceDate) ? "LATE" : "ON_TRACK";
}

export function isMilestoneLate(status: MilestoneScheduleStatus): boolean {
  return status === "LATE" || status === "COMPLETED_LATE";
}
