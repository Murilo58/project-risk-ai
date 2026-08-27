"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProjectForm } from "@/components/domain/project-form";
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
      <h1 className="text-2xl font-semibold">Novo projeto</h1>
      <ProjectForm
        onSubmit={handleSubmit}
        isSubmitting={createProject.isPending}
        submitLabel="Criar projeto"
      />
    </div>
  );
}
