"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CriticalityBadge, ProjectStatusBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
import { PageHeader } from "@/components/domain/page-header";
import { SectionCard } from "@/components/domain/section-card";
import { useProjects } from "@/hooks/use-projects";
import { formatDate } from "@/lib/format";

export default function ProjectsPage() {
  const { data: projects, isLoading, isError } = useProjects();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projetos"
        description="Gerencie o cadastro de projetos do portfólio."
        action={
          <Button asChild>
            <Link href="/projects/new">Novo projeto</Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <EmptyState
          title="Não foi possível carregar os projetos"
          description="Verifique sua conexão e tente novamente."
        />
      )}

      {!isLoading && !isError && projects?.length === 0 && (
        <EmptyState
          title="Nenhum projeto cadastrado"
          description="Comece cadastrando o primeiro projeto para acompanhar seus riscos e saúde."
          action={
            <Button asChild>
              <Link href="/projects/new">Cadastrar projeto</Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <SectionCard title="Todos os projetos">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Término previsto</TableHead>
                <TableHead>Riscos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-primary hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.owner}</TableCell>
                  <TableCell>
                    <ProjectStatusBadge value={project.status} />
                  </TableCell>
                  <TableCell>
                    <CriticalityBadge value={project.criticality} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {project.progressPercent}%
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{project._count.risks}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}
    </div>
  );
}
