"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useDashboard } from "@/hooks/use-dashboard";
import { HEALTH_BAND_LABELS } from "@/lib/enums";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Executivo</h1>
          <p className="text-muted-foreground text-sm">
            Visão consolidada da saúde do portfólio de projetos.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Gerenciar projetos</Link>
        </Button>
      </div>

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
              <Card key={band}>
                <CardContent className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">
                    {HEALTH_BAND_LABELS[band]}
                  </span>
                  <span className="text-3xl font-bold">{data.summary[band]}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">
                  Riscos críticos abertos
                </span>
                <span className="text-3xl font-bold">{data.criticalOpenRisks}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">
                  Milestones atrasados
                </span>
                <span className="text-3xl font-bold">{data.delayedMilestones}</span>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Projetos por Health Score</h2>
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
                      <Link href={`/projects/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>{project.owner}</TableCell>
                    <TableCell>
                      <CriticalityBadge value={project.criticality} />
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <span className="font-semibold">{project.score}</span>
                      <HealthBandBadge value={project.band} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
