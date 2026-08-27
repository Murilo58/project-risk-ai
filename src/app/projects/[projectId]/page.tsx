"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CriticalityBadge, ProjectStatusBadge } from "@/components/domain/badges";
import { DependenciesSection } from "@/components/domain/dependencies-section";
import { EmptyState } from "@/components/domain/empty-state";
import { AiAdvisorSection } from "@/components/domain/ai-advisor-section";
import { HealthScoreCard } from "@/components/domain/health-score-card";
import { MilestonesSection } from "@/components/domain/milestones-section";
import { RisksSection } from "@/components/domain/risks-section";
import { SectionCard } from "@/components/domain/section-card";
import { useDeleteProject, useProject } from "@/hooks/use-projects";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { data: project, isLoading, isError } = useProject(projectId);
  const deleteProject = useDeleteProject();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <EmptyState
        title="Projeto não encontrado"
        description="Ele pode ter sido removido."
        action={
          <Button asChild variant="outline">
            <Link href="/projects">Voltar para projetos</Link>
          </Button>
        }
      />
    );
  }

  function handleDelete() {
    if (!project) return;
    if (
      !window.confirm(
        `Remover o projeto "${project.name}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    deleteProject.mutate(project.id, {
      onSuccess: () => {
        toast.success("Projeto removido.");
        router.push("/projects");
      },
      onError: (error) =>
        toast.error(
          error instanceof ApiError ? error.message : "Erro ao remover projeto.",
        ),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <div className="flex gap-2">
            <ProjectStatusBadge value={project.status} />
            <CriticalityBadge value={project.criticality} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline">
            <Link href={`/projects/${project.id}/edit`}>Editar</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            Remover
          </Button>
        </div>
      </div>

      <SectionCard title="Informações gerais">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Responsável" value={project.owner} />
          <Field label="Progresso" value={`${project.progressPercent}%`} />
          <Field label="Início" value={formatDate(project.startDate)} />
          <Field label="Término previsto" value={formatDate(project.endDate)} />
          <Field
            label="Equipe"
            value={project.teamSize ? `${project.teamSize} pessoas` : "—"}
          />
          <Field label="Riscos" value={String(project.risks.length)} />
          {project.description && (
            <div className="col-span-2 sm:col-span-4">
              <Field label="Descrição" value={project.description} />
            </div>
          )}
          {project.notes && (
            <div className="col-span-2 sm:col-span-4">
              <Field label="Observações" value={project.notes} />
            </div>
          )}
        </div>
      </SectionCard>

      <HealthScoreCard projectId={project.id} />

      <MilestonesSection projectId={project.id} milestones={project.milestones} />
      <DependenciesSection projectId={project.id} dependencies={project.dependencies} />
      <RisksSection projectId={project.id} risks={project.risks} />
      <AiAdvisorSection projectId={project.id} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-0.5 text-sm">{value}</p>
    </div>
  );
}
