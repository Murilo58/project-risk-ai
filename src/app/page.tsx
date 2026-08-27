"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CriticalityBadge, HealthBandBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
import { PageHeader } from "@/components/domain/page-header";
import { SectionCard } from "@/components/domain/section-card";
import { StatCard, type StatCardTone } from "@/components/domain/stat-card";
import { useDashboard } from "@/hooks/use-dashboard";
import { HEALTH_BAND_LABELS, type HealthBand } from "@/lib/enums";

const HEALTH_BAND_TONE: Record<HealthBand, StatCardTone> = {
  HEALTHY: "success",
  ATTENTION: "warning",
  RISK: "severe",
  CRITICAL: "danger",
};

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada da saúde do portfólio de projetos."
        action={
          <Button asChild variant="outline">
            <Link href="/projects">Gerenciar projetos</Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <EmptyState title="Não foi possível carregar o dashboard." />}

      {data && data.projects.length === 0 && (
        <EmptyState
          title="Nenhum projeto cadastrado ainda"
          description="Cadastre projetos para acompanhar a saúde do seu portfólio aqui."
          action={
            <Button asChild>
              <Link href="/projects/new">Cadastrar projeto</Link>
            </Button>
          }
        />
      )}

      {data && data.projects.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["HEALTHY", "ATTENTION", "RISK", "CRITICAL"] as const).map((band) => (
              <StatCard
                key={band}
                label={HEALTH_BAND_LABELS[band]}
                value={data.summary[band]}
                tone={HEALTH_BAND_TONE[band]}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Riscos críticos abertos"
              value={data.criticalOpenRisks}
              tone={data.criticalOpenRisks > 0 ? "danger" : "neutral"}
            />
            <StatCard
              label="Milestones atrasados"
              value={data.delayedMilestones}
              tone={data.delayedMilestones > 0 ? "warning" : "neutral"}
            />
          </div>

          <SectionCard title="Projetos por Health Score">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Health Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-primary hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.owner}
                    </TableCell>
                    <TableCell>
                      <CriticalityBadge value={project.criticality} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">
                          {project.score}
                        </span>
                        <HealthBandBadge value={project.band} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </>
      )}
    </div>
  );
}
