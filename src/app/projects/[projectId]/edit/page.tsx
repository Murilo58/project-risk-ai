"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/domain/empty-state";
import { PageHeader } from "@/components/domain/page-header";
import { ProjectForm } from "@/components/domain/project-form";
import { SectionCard } from "@/components/domain/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { ApiError } from "@/lib/api-client";
import type { ProjectInput } from "@/lib/validation/project";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { data: project, isLoading, isError } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !project) {
    return <EmptyState title="Projeto não encontrado" />;
  }

  function handleSubmit(values: ProjectInput) {
    updateProject.mutate(values, {
      onSuccess: () => {
        toast.success("Projeto atualizado.");
        router.push(`/projects/${projectId}`);
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : "Erro ao atualizar projeto.",
        );
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar projeto" description={project.name} />
      <SectionCard title="Dados do projeto">
        <ProjectForm
          defaultValues={project}
          onSubmit={handleSubmit}
          isSubmitting={updateProject.isPending}
        />
      </SectionCard>
    </div>
  );
}
