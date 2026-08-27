"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { RiskForm } from "@/components/domain/risk-form";
import { SectionCard } from "@/components/domain/section-card";
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

function AiSuggestionBadge() {
  return (
    <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700">
      Sugestão de IA
    </Badge>
  );
}

function AiSuggestionCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border border-l-4 border-l-indigo-400 p-4">
      {children}
    </div>
  );
}

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
    <SectionCard
      title="AI Risk Advisor"
      description="Apoio à decisão via IA — sugestões nunca são aplicadas automaticamente."
      action={
        <Button onClick={handleAnalyze} disabled={runAnalysis.isPending}>
          {runAnalysis.isPending ? "Analisando..." : "Analisar com IA"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
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
            <AiSuggestionCard key={suggestion.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AiSuggestionBadge />
                  <h3 className="text-foreground text-base font-semibold">
                    {content.title}
                  </h3>
                </div>
              </div>

              <p className="text-foreground text-sm">{content.description}</p>

              <div className="grid grid-cols-3 gap-3 sm:w-fit sm:grid-cols-3">
                <MiniField
                  label="Categoria"
                  value={RISK_CATEGORY_LABELS[content.category]}
                />
                <MiniField label="Probabilidade" value={String(content.probability)} />
                <MiniField label="Impacto" value={String(content.impact)} />
              </div>

              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Mitigação sugerida
                </p>
                <p className="text-foreground mt-0.5 text-sm">
                  {content.mitigationStrategy}
                </p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => setReviewing(suggestion)}>
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDismiss(suggestion.id)}
                >
                  Descartar
                </Button>
              </div>
            </AiSuggestionCard>
          );
        })}
      </div>

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
    </SectionCard>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20">
      <p className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground text-sm font-medium">{value}</p>
    </div>
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
    <AiSuggestionCard>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AiSuggestionBadge />
          <h3 className="text-foreground text-base font-semibold">Resumo executivo</h3>
        </div>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Descartar
        </Button>
      </div>
      <p className="text-foreground text-sm">{content.summary}</p>
      {content.attentionPoints.length > 0 && (
        <ul className="text-foreground list-inside list-disc text-sm">
          {content.attentionPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      )}
    </AiSuggestionCard>
  );
}
