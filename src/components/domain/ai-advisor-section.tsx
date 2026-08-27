"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { RiskForm } from "@/components/domain/risk-form";
import {
  useAcceptSuggestion,
  useAiSuggestions,
  useDismissSuggestion,
  useRunAiAnalysis,
} from "@/hooks/use-ai-advisor";
import { useCreateRisk } from "@/hooks/use-risks";
import { ApiError } from "@/lib/api-client";
import { RISK_CATEGORY_LABELS } from "@/lib/enums";
import type { RiskInput } from "@/lib/validation/risk";
import type {
  AiExecutiveSummaryContent,
  AiRiskSuggestionContent,
  AiSuggestion,
} from "@/types/api";

export function AiAdvisorSection({ projectId }: { projectId: string }) {
  const { data: suggestions } = useAiSuggestions(projectId);
  const runAnalysis = useRunAiAnalysis(projectId);
  const dismissSuggestion = useDismissSuggestion(projectId);
  const acceptSuggestion = useAcceptSuggestion(projectId);
  const createRisk = useCreateRisk(projectId);
  const [reviewing, setReviewing] = useState<AiSuggestion | null>(null);

  const pending = suggestions?.filter((s) => s.status === "PENDING") ?? [];
  const summary = pending.find((s) => s.type === "EXECUTIVE_SUMMARY");
  const riskSuggestions = pending.filter((s) => s.type === "RISK");

  function handleAnalyze() {
    runAnalysis.mutate(undefined, {
      onSuccess: () => toast.success("Análise concluída."),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 429) {
          toast.error(
            `Aguarde ${error.retryAfterSeconds ?? "alguns"}s antes de analisar novamente.`,
          );
        } else if (error instanceof ApiError && error.status === 503) {
          toast.error(error.message);
        } else {
          toast.error("Erro ao solicitar análise de IA.");
        }
      },
    });
  }

  function handleDismiss(id: string) {
    dismissSuggestion.mutate(id, {
      onSuccess: () => toast.success("Sugestão descartada."),
    });
  }

  function handleAcceptSubmit(values: RiskInput) {
    if (!reviewing) return;
    createRisk.mutate(values, {
      onSuccess: () => {
        acceptSuggestion.mutate(reviewing.id);
        toast.success("Risco criado a partir da sugestão de IA.");
        setReviewing(null);
      },
      onError: () => toast.error("Erro ao criar risco."),
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Risk Advisor</h2>
          <p className="text-muted-foreground text-sm">
            Apoio à decisão via IA — sugestões nunca são aplicadas automaticamente.
          </p>
        </div>
        <Button onClick={handleAnalyze} disabled={runAnalysis.isPending}>
          {runAnalysis.isPending ? "Analisando..." : "Analisar com IA"}
        </Button>
      </div>

      {summary && (
        <ExecutiveSummaryCard
          content={summary.content as AiExecutiveSummaryContent}
          onDismiss={() => handleDismiss(summary.id)}
        />
      )}

      {riskSuggestions.length === 0 && !summary && (
        <EmptyState
          title="Nenhuma sugestão pendente"
          description="Clique em “Analisar com IA” para identificar riscos potenciais e sinais de deterioração."
        />
      )}

      {riskSuggestions.map((suggestion) => {
        const content = suggestion.content as AiRiskSuggestionContent;
        return (
          <Card key={suggestion.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Sugestão de IA</Badge>
                <CardTitle className="text-base">{content.title}</CardTitle>
              </div>
              <span className="text-muted-foreground text-xs">
                {RISK_CATEGORY_LABELS[content.category]} · Prob. {content.probability} ·
                Impacto {content.impact}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm">{content.description}</p>
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Mitigação sugerida:</span>{" "}
                {content.mitigationStrategy}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setReviewing(suggestion)}>
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(suggestion.id)}
                >
                  Descartar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={reviewing !== null}
        onOpenChange={(open) => !open && setReviewing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar risco sugerido pela IA</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <RiskForm
              defaultValues={reviewing.content as AiRiskSuggestionContent}
              onSubmit={handleAcceptSubmit}
              isSubmitting={createRisk.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ExecutiveSummaryCard({
  content,
  onDismiss,
}: {
  content: AiExecutiveSummaryContent;
  onDismiss: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Sugestão de IA</Badge>
          <CardTitle className="text-base">Resumo executivo</CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Descartar
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">{content.summary}</p>
        {content.attentionPoints.length > 0 && (
          <ul className="list-inside list-disc text-sm">
            {content.attentionPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
