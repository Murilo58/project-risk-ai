"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthBandBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
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
    <Card>
      <CardHeader>
        <CardTitle>Project Health Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading && <Skeleton className="h-40 w-full" />}
        {isError && <EmptyState title="Não foi possível calcular o Health Score." />}

        {data && (
          <>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold">{data.score}</span>
              <span className="text-muted-foreground text-sm">/ 100</span>
              <HealthBandBadge value={data.band} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map(
                (key) => (
                  <div key={key} className="flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-muted-foreground text-xs">
                      {DIMENSION_LABELS[key]}
                    </span>
                    <span className="text-lg font-semibold">
                      {data.dimensions[key].score}
                    </span>
                    <HealthBandBadge value={data.dimensions[key].band} />
                  </div>
                ),
              )}
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Ver fatores considerados
              </summary>
              <div className="mt-2 flex flex-col gap-3">
                {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map(
                  (key) => {
                    const dim = data.dimensions[key];
                    if (dim.notes.length === 0) return null;
                    return (
                      <div key={key}>
                        <p className="font-medium">{DIMENSION_LABELS[key]}</p>
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
            <p className="mb-2 text-sm font-medium">Evolução do Health Score</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis
                  dataKey="snapshotDate"
                  tickFormatter={(value: string) => formatDate(value)}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip
                  labelFormatter={(value) => formatDate(String(value))}
                  formatter={(value) => [String(value), "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
