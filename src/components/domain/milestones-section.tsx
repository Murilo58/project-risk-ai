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
import { DelayedBadge, MilestoneStatusBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
import { MilestoneForm } from "@/components/domain/milestone-form";
import { SectionCard } from "@/components/domain/section-card";
import {
  useCreateMilestone,
  useDeleteMilestone,
  useUpdateMilestone,
} from "@/hooks/use-milestones";
import { ApiError } from "@/lib/api-client";
import { formatDate, isMilestoneDelayed } from "@/lib/format";
import type { MilestoneInput } from "@/lib/validation/milestone";
import type { Milestone } from "@/types/api";

export function MilestonesSection({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Milestone[];
}) {
  const [editing, setEditing] = useState<Milestone | "new" | null>(null);
  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);

  function handleSubmit(values: MilestoneInput) {
    const onError = (error: unknown) =>
      toast.error(error instanceof ApiError ? error.message : "Erro ao salvar marco.");

    if (editing && editing !== "new") {
      updateMilestone.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            toast.success("Marco atualizado.");
            setEditing(null);
          },
          onError,
        },
      );
    } else {
      createMilestone.mutate(values, {
        onSuccess: () => {
          toast.success("Marco criado.");
          setEditing(null);
        },
        onError,
      });
    }
  }

  function handleDelete(milestone: Milestone) {
    if (!window.confirm(`Remover o marco "${milestone.description}"?`)) return;
    deleteMilestone.mutate(milestone.id, {
      onSuccess: () => toast.success("Marco removido."),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Erro ao remover marco."),
    });
  }

  const isSubmitting = createMilestone.isPending || updateMilestone.isPending;

  return (
    <SectionCard
      title="Marcos"
      action={
        <Button size="sm" onClick={() => setEditing("new")}>
          Adicionar marco
        </Button>
      }
    >
      {milestones.length === 0 ? (
        <EmptyState
          title="Nenhum marco cadastrado"
          description="Registre os principais marcos do cronograma deste projeto."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Planejado</TableHead>
              <TableHead>Realizado</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones.map((milestone) => (
              <TableRow key={milestone.id}>
                <TableCell className="font-medium">{milestone.description}</TableCell>
                <TableCell>{formatDate(milestone.plannedDate)}</TableCell>
                <TableCell>{formatDate(milestone.actualDate)}</TableCell>
                <TableCell>{milestone.owner}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  <MilestoneStatusBadge value={milestone.status} />
                  {isMilestoneDelayed(milestone) && <DelayedBadge />}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(milestone)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(milestone)}
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
            <DialogTitle>{editing === "new" ? "Novo marco" : "Editar marco"}</DialogTitle>
          </DialogHeader>
          <MilestoneForm
            defaultValues={editing !== "new" ? (editing ?? undefined) : undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
