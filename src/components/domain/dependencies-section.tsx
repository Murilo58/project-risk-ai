"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CriticalityBadge, DependencyStatusBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
import { DependencyForm } from "@/components/domain/dependency-form";
import { SectionCard } from "@/components/domain/section-card";
import {
  useCreateDependency,
  useDeleteDependency,
  useUpdateDependency,
} from "@/hooks/use-dependencies";
import { ApiError } from "@/lib/api-client";
import { DEPENDENCY_TYPE_LABELS } from "@/lib/enums";
import type { DependencyInput } from "@/lib/validation/dependency";
import type { Dependency } from "@/types/api";

export function DependenciesSection({
  projectId,
  dependencies,
}: {
  projectId: string;
  dependencies: Dependency[];
}) {
  const [editing, setEditing] = useState<Dependency | "new" | null>(null);
  const createDependency = useCreateDependency(projectId);
  const updateDependency = useUpdateDependency(projectId);
  const deleteDependency = useDeleteDependency(projectId);

  function handleSubmit(values: DependencyInput) {
    const onError = (error: unknown) =>
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao salvar dependência.",
      );

    if (editing && editing !== "new") {
      updateDependency.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            toast.success("Dependência atualizada.");
            setEditing(null);
          },
          onError,
        },
      );
    } else {
      createDependency.mutate(values, {
        onSuccess: () => {
          toast.success("Dependência criada.");
          setEditing(null);
        },
        onError,
      });
    }
  }

  function handleDelete(dependency: Dependency) {
    if (!window.confirm(`Remover a dependência "${dependency.description}"?`)) return;
    deleteDependency.mutate(dependency.id, {
      onSuccess: () => toast.success("Dependência removida."),
      onError: (error) =>
        toast.error(
          error instanceof ApiError ? error.message : "Erro ao remover dependência.",
        ),
    });
  }

  const isSubmitting = createDependency.isPending || updateDependency.isPending;

  return (
    <SectionCard
      title="Dependências"
      action={
        <Button size="sm" onClick={() => setEditing("new")}>
          Adicionar dependência
        </Button>
      }
    >
      {dependencies.length === 0 ? (
        <EmptyState
          title="Nenhuma dependência cadastrada"
          description="Registre dependências internas ou externas que podem impactar o projeto."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependencies.map((dependency) => (
              <TableRow key={dependency.id}>
                <TableCell className="font-medium">{dependency.description}</TableCell>
                <TableCell>{DEPENDENCY_TYPE_LABELS[dependency.type]}</TableCell>
                <TableCell>{dependency.owner}</TableCell>
                <TableCell>
                  <CriticalityBadge value={dependency.criticality} />
                </TableCell>
                <TableCell>
                  <DependencyStatusBadge value={dependency.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(dependency)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(dependency)}
                  >
                    Remover
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Nova dependência" : "Editar dependência"}
            </DialogTitle>
          </DialogHeader>
          <DependencyForm
            defaultValues={editing !== "new" ? (editing ?? undefined) : undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
