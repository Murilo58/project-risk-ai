import type { Criticality } from "@/lib/enums";

// See HEALTH_SCORE.md §3 for the rationale behind these bands.
export function computeSeverity(probability: number, impact: number): number {
  return probability * impact;
}

export function severityBand(severity: number): Criticality {
  if (severity >= 16) return "CRITICAL";
  if (severity >= 10) return "HIGH";
  if (severity >= 5) return "MEDIUM";
  return "LOW";
}

export function isRiskOpen(status: string): boolean {
  return status !== "MITIGATED" && status !== "CLOSED";
}
