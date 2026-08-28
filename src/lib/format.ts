import { classifyMilestoneSchedule, isMilestoneLate } from "@/domain/milestones/schedule";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function isMilestoneDelayed(milestone: {
  plannedDate: string;
  actualDate: string | null;
  status: string;
}): boolean {
  const status = classifyMilestoneSchedule(
    {
      status: milestone.status,
      plannedDate: new Date(milestone.plannedDate),
      actualDate: milestone.actualDate ? new Date(milestone.actualDate) : null,
    },
    new Date(),
  );
  return isMilestoneLate(status);
}
