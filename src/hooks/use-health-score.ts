import { useQuery } from "@tanstack/react-query";

import type { HealthScoreResult } from "@/domain/health-score/calculate";
import { api } from "@/lib/api-client";

export type HealthScoreSnapshotPoint = { snapshotDate: string; overallScore: number };

export function useHealthScore(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "health-score"],
    queryFn: () => api.get<HealthScoreResult>(`/api/projects/${projectId}/health-score`),
    enabled: Boolean(projectId),
  });
}

export function useHealthScoreHistory(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "health-score", "history"],
    queryFn: () =>
      api.get<HealthScoreSnapshotPoint[]>(
        `/api/projects/${projectId}/health-score/history`,
      ),
    enabled: Boolean(projectId),
  });
}
