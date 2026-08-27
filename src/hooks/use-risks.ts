import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { projectKeys } from "@/hooks/use-projects";
import type { RiskInput } from "@/lib/validation/risk";
import type { Risk } from "@/types/api";

export function useCreateRisk(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RiskInput) =>
      api.post<Risk>(`/api/projects/${projectId}/risks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useUpdateRisk(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RiskInput> }) =>
      api.patch<Risk>(`/api/risks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useDeleteRisk(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/risks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
