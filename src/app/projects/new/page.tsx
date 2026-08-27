"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/domain/page-header";
import { ProjectForm } from "@/components/domain/project-form";
import { SectionCard } from "@/components/domain/section-card";
import { useCreateProject } from "@/hooks/use-projects";
import { ApiError } from "@/lib/api-client";
import type { ProjectInput } from "@/lib/validation/project";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  function handleSubmit(values: ProjectInput) {
    createProject.mutate(values, {
      onSuccess: (project) => {
        toast.success("Projeto criado com sucesso.");
        router.push(`/projects/${project.id}`);
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : "Erro ao criar projeto.");
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Novo projeto"
        description="Cadastre um novo projeto no portfólio."
      />
      <SectionCard title="Dados do projeto">
        <ProjectForm
          onSubmit={handleSubmit}
          isSubmitting={createProject.isPending}
          submitLabel="Criar projeto"
        />
      </SectionCard>
    </div>
  );
}
