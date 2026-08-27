import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { projectKeys } from "@/hooks/use-projects";
import type { DependencyInput } from "@/lib/validation/dependency";
import type { Dependency } from "@/types/api";

export function useCreateDependency(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DependencyInput) =>
      api.post<Dependency>(`/api/projects/${projectId}/dependencies`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useUpdateDependency(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DependencyInput> }) =>
      api.patch<Dependency>(`/api/dependencies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useDeleteDependency(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/dependencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
