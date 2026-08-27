import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CRITICALITY_LABELS,
  DEPENDENCY_STATUS_LABELS,
  HEALTH_BAND_LABELS,
  MILESTONE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  RISK_STATUS_LABELS,
  type Criticality,
  type DependencyStatus,
  type HealthBand,
  type MilestoneStatus,
  type ProjectStatus,
  type RiskStatus,
} from "@/lib/enums";
import { severityBand } from "@/domain/risks/severity";

const TONE_CLASSES = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  severe: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
} as const;

function ToneBadge({ tone, label }: { tone: keyof typeof TONE_CLASSES; label: string }) {
  return <Badge className={cn(TONE_CLASSES[tone])}>{label}</Badge>;
}

const CRITICALITY_TONE: Record<Criticality, keyof typeof TONE_CLASSES> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

export function CriticalityBadge({ value }: { value: Criticality }) {
  return <ToneBadge tone={CRITICALITY_TONE[value]} label={CRITICALITY_LABELS[value]} />;
}

const PROJECT_STATUS_TONE: Record<ProjectStatus, keyof typeof TONE_CLASSES> = {
  PLANNED: "neutral",
  IN_PROGRESS: "info",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export function ProjectStatusBadge({ value }: { value: ProjectStatus }) {
  return (
    <ToneBadge tone={PROJECT_STATUS_TONE[value]} label={PROJECT_STATUS_LABELS[value]} />
  );
}

const MILESTONE_STATUS_TONE: Record<MilestoneStatus, keyof typeof TONE_CLASSES> = {
  PLANNED: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export function MilestoneStatusBadge({ value }: { value: MilestoneStatus }) {
  return (
    <ToneBadge
      tone={MILESTONE_STATUS_TONE[value]}
      label={MILESTONE_STATUS_LABELS[value]}
    />
  );
}

const DEPENDENCY_STATUS_TONE: Record<DependencyStatus, keyof typeof TONE_CLASSES> = {
  OPEN: "neutral",
  IN_PROGRESS: "info",
  BLOCKED: "danger",
  RESOLVED: "success",
  CANCELLED: "neutral",
};

export function DependencyStatusBadge({ value }: { value: DependencyStatus }) {
  return (
    <ToneBadge
      tone={DEPENDENCY_STATUS_TONE[value]}
      label={DEPENDENCY_STATUS_LABELS[value]}
    />
  );
}

export function DelayedBadge() {
  return <ToneBadge tone="danger" label="Atrasado" />;
}

export function SeverityBadge({ severity }: { severity: number }) {
  const band = severityBand(severity);
  return (
    <ToneBadge
      tone={CRITICALITY_TONE[band]}
      label={`${CRITICALITY_LABELS[band]} (${severity})`}
    />
  );
}

const RISK_STATUS_TONE: Record<RiskStatus, keyof typeof TONE_CLASSES> = {
  OPEN: "neutral",
  MITIGATED: "success",
  CLOSED: "neutral",
};

export function RiskStatusBadge({ value }: { value: RiskStatus }) {
  return <ToneBadge tone={RISK_STATUS_TONE[value]} label={RISK_STATUS_LABELS[value]} />;
}

const HEALTH_BAND_TONE: Record<HealthBand, keyof typeof TONE_CLASSES> = {
  HEALTHY: "success",
  ATTENTION: "warning",
  RISK: "severe",
  CRITICAL: "danger",
};

export function HealthBandBadge({ value }: { value: HealthBand }) {
  return <ToneBadge tone={HEALTH_BAND_TONE[value]} label={HEALTH_BAND_LABELS[value]} />;
}
