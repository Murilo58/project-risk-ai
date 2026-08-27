import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Criticality, HealthBand, ProjectStatus } from "@/lib/enums";

export type DashboardProjectSummary = {
  id: string;
  name: string;
  owner: string;
  criticality: Criticality;
  status: ProjectStatus;
  score: number;
  band: HealthBand;
};

export type DashboardData = {
  summary: Record<HealthBand, number>;
  criticalOpenRisks: number;
  delayedMilestones: number;
  projects: DashboardProjectSummary[];
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}
