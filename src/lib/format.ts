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
  if (milestone.status === "CANCELLED") return false;
  if (milestone.actualDate) return milestone.actualDate > milestone.plannedDate;
  return (
    milestone.status !== "COMPLETED" && milestone.plannedDate < new Date().toISOString()
  );
}
