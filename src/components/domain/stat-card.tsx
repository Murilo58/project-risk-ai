import { cn } from "@/lib/utils";

const TONE_BORDER = {
  neutral: "border-l-slate-300",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  severe: "border-l-orange-500",
  danger: "border-l-red-500",
} as const;

export type StatCardTone = keyof typeof TONE_BORDER;

export function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: StatCardTone;
}) {
  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-1 rounded-xl border border-l-4 p-4 shadow-sm",
        TONE_BORDER[tone],
      )}
    >
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-3xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
