// Single source of truth for enum values + pt-BR display labels.
// Values must stay in sync with prisma/schema.prisma.

export const PROJECT_STATUS = [
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  ON_HOLD: "Em espera",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const CRITICALITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Criticality = (typeof CRITICALITY)[number];
export const CRITICALITY_LABELS: Record<Criticality, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const MILESTONE_STATUS = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUS)[number];
export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const DEPENDENCY_TYPE = ["INTERNAL", "EXTERNAL"] as const;
export type DependencyType = (typeof DEPENDENCY_TYPE)[number];
export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  INTERNAL: "Interna",
  EXTERNAL: "Externa",
};

export const DEPENDENCY_STATUS = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "RESOLVED",
  "CANCELLED",
] as const;
export type DependencyStatus = (typeof DEPENDENCY_STATUS)[number];
export const DEPENDENCY_STATUS_LABELS: Record<DependencyStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  BLOCKED: "Bloqueada",
  RESOLVED: "Resolvida",
  CANCELLED: "Cancelada",
};

export const RISK_CATEGORY = [
  "SCHEDULE",
  "SCOPE",
  "RESOURCES",
  "TECHNOLOGY",
  "EXTERNAL_DEPENDENCY",
  "VENDOR",
  "INTEGRATION",
  "QUALITY",
  "BUSINESS",
  "OTHER",
] as const;
export type RiskCategory = (typeof RISK_CATEGORY)[number];
export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  SCHEDULE: "Prazo",
  SCOPE: "Escopo",
  RESOURCES: "Recursos",
  TECHNOLOGY: "Tecnologia",
  EXTERNAL_DEPENDENCY: "Dependência externa",
  VENDOR: "Fornecedor",
  INTEGRATION: "Integração",
  QUALITY: "Qualidade",
  BUSINESS: "Negócio",
  OTHER: "Outros",
};

export const RISK_STATUS = ["OPEN", "MITIGATED", "CLOSED"] as const;
export type RiskStatus = (typeof RISK_STATUS)[number];
export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  OPEN: "Aberto",
  MITIGATED: "Mitigado",
  CLOSED: "Encerrado",
};

export const HEALTH_BAND = ["HEALTHY", "ATTENTION", "RISK", "CRITICAL"] as const;
export type HealthBand = (typeof HEALTH_BAND)[number];
export const HEALTH_BAND_LABELS: Record<HealthBand, string> = {
  HEALTHY: "Saudável",
  ATTENTION: "Atenção",
  RISK: "Risco",
  CRITICAL: "Crítico",
};

export function asOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }));
}
