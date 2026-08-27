"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { HealthBandBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
import { SectionCard } from "@/components/domain/section-card";
import { useHealthScore, useHealthScoreHistory } from "@/hooks/use-health-score";
import { formatDate } from "@/lib/format";

const DIMENSION_LABELS = {
  schedule: "Prazo",
  risks: "Riscos",
  dependencies: "Dependências",
  scope: "Escopo",
  resources: "Recursos",
} as const;

export function HealthScoreCard({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useHealthScore(projectId);
  const { data: history } = useHealthScoreHistory(projectId);

  return (
    <SectionCard title="Health Score">
      <div className="flex flex-col gap-6">
        {isLoading && <Skeleton className="h-40 w-full" />}
        {isError && <EmptyState title="Não foi possível calcular o Health Score." />}

        {data && (
          <>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-foreground text-5xl font-bold tracking-tight tabular-nums">
                {data.score}
              </span>
              <span className="text-muted-foreground text-lg">/ 100</span>
              <HealthBandBadge value={data.band} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map(
                (key) => (
                  <div
                    key={key}
                    className="bg-muted/40 flex flex-col gap-1.5 rounded-lg border p-3"
                  >
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {DIMENSION_LABELS[key]}
                    </span>
                    <span className="text-foreground text-xl font-semibold tabular-nums">
                      {data.dimensions[key].score}
                    </span>
                    <HealthBandBadge value={data.dimensions[key].band} />
                  </div>
                ),
              )}
            </div>

            <details className="text-sm">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-medium">
                Ver fatores considerados
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map(
                  (key) => {
                    const dim = data.dimensions[key];
                    if (dim.notes.length === 0) return null;
                    return (
                      <div key={key}>
                        <p className="text-foreground font-medium">
                          {DIMENSION_LABELS[key]}
                        </p>
                        <ul className="text-muted-foreground list-inside list-disc">
                          {dim.notes.map((note, index) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  },
                )}
              </div>
            </details>
          </>
        )}

        {history && history.length > 1 && (
          <div className="h-48 w-full">
            <p className="text-foreground mb-2 text-sm font-medium">
              Evolução do Health Score
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis
                  dataKey="snapshotDate"
                  tickFormatter={(value: string) => formatDate(value)}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                />
                <YAxis domain={[0, 100]} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip
                  labelFormatter={(value) => formatDate(String(value))}
                  formatter={(value) => [String(value), "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
