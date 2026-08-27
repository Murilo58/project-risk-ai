import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { AiSuggestion } from "@/types/api";

const suggestionsKey = (projectId: string) => ["projects", projectId, "ai-suggestions"];

export function useAiSuggestions(projectId: string) {
  return useQuery({
    queryKey: suggestionsKey(projectId),
    queryFn: () =>
      api.get<AiSuggestion[]>(`/api/projects/${projectId}/ai-advisor/suggestions`),
    enabled: Boolean(projectId),
  });
}

export function useRunAiAnalysis(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<AiSuggestion[]>(`/api/projects/${projectId}/ai-advisor`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(projectId) });
    },
  });
}

export function useDismissSuggestion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<AiSuggestion>(`/api/ai-advisor/suggestions/${id}/dismiss`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(projectId) });
    },
  });
}

export function useAcceptSuggestion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<AiSuggestion>(`/api/ai-advisor/suggestions/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(projectId) });
    },
  });
}
