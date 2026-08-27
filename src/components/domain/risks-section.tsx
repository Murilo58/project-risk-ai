"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskStatusBadge, SeverityBadge } from "@/components/domain/badges";
import { EmptyState } from "@/components/domain/empty-state";
import { RiskForm } from "@/components/domain/risk-form";
import { useCreateRisk, useDeleteRisk, useUpdateRisk } from "@/hooks/use-risks";
import { ApiError } from "@/lib/api-client";
import {
  asOptions,
  RISK_CATEGORY,
  RISK_CATEGORY_LABELS,
  RISK_STATUS,
  RISK_STATUS_LABELS,
} from "@/lib/enums";
import type { RiskInput } from "@/lib/validation/risk";
import type { Risk } from "@/types/api";

const categoryOptions = asOptions(RISK_CATEGORY, RISK_CATEGORY_LABELS);
const statusOptions = asOptions(RISK_STATUS, RISK_STATUS_LABELS);
const ALL = "ALL";

export function RisksSection({ projectId, risks }: { projectId: string; risks: Risk[] }) {
  const [editing, setEditing] = useState<Risk | "new" | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const createRisk = useCreateRisk(projectId);
  const updateRisk = useUpdateRisk(projectId);
  const deleteRisk = useDeleteRisk(projectId);

  const filteredRisks = useMemo(
    () =>
      risks.filter(
        (risk) =>
          (categoryFilter === ALL || risk.category === categoryFilter) &&
          (statusFilter === ALL || risk.status === statusFilter),
      ),
    [risks, categoryFilter, statusFilter],
  );

  function handleSubmit(values: RiskInput) {
    const onError = (error: unknown) =>
      toast.error(error instanceof ApiError ? error.message : "Erro ao salvar risco.");

    if (editing && editing !== "new") {
      updateRisk.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            toast.success("Risco atualizado.");
            setEditing(null);
          },
          onError,
        },
      );
    } else {
      createRisk.mutate(values, {
        onSuccess: () => {
          toast.success("Risco criado.");
          setEditing(null);
        },
        onError,
      });
    }
  }

  function handleDelete(risk: Risk) {
    if (!window.confirm(`Remover o risco "${risk.title}"?`)) return;
    deleteRisk.mutate(risk.id, {
      onSuccess: () => toast.success("Risco removido."),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Erro ao remover risco."),
    });
  }

  const isSubmitting = createRisk.isPending || updateRisk.isPending;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Riscos</h2>
        <Button size="sm" onClick={() => setEditing("new")}>
          Adicionar risco
        </Button>
      </div>

      {risks.length > 0 && (
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as categorias</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {risks.length === 0 ? (
        <EmptyState
          title="Nenhum risco cadastrado"
          description="Registre os riscos identificados para este projeto."
        />
      ) : filteredRisks.length === 0 ? (
        <EmptyState title="Nenhum risco corresponde aos filtros selecionados" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Severidade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRisks.map((risk) => (
              <TableRow key={risk.id}>
                <TableCell className="font-medium">{risk.title}</TableCell>
                <TableCell>{RISK_CATEGORY_LABELS[risk.category]}</TableCell>
                <TableCell>
                  <SeverityBadge severity={risk.severity} />
                </TableCell>
                <TableCell>{risk.owner}</TableCell>
                <TableCell>
                  <RiskStatusBadge value={risk.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(risk)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(risk)}>
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
            <DialogTitle>{editing === "new" ? "Novo risco" : "Editar risco"}</DialogTitle>
          </DialogHeader>
          <RiskForm
            defaultValues={editing !== "new" ? (editing ?? undefined) : undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
