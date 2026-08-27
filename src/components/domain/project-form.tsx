"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  asOptions,
  CRITICALITY,
  CRITICALITY_LABELS,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
} from "@/lib/enums";
import { toDateInputValue } from "@/lib/format";
import { projectSchema, type ProjectInput } from "@/lib/validation/project";
import type { Project } from "@/types/api";

const criticalityOptions = asOptions(CRITICALITY, CRITICALITY_LABELS);
const statusOptions = asOptions(PROJECT_STATUS, PROJECT_STATUS_LABELS);

export function ProjectForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<Project>;
  onSubmit: (values: ProjectInput) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      owner: defaultValues?.owner ?? "",
      startDate: toDateInputValue(defaultValues?.startDate) as unknown as Date,
      endDate: toDateInputValue(defaultValues?.endDate) as unknown as Date | undefined,
      status: defaultValues?.status ?? "PLANNED",
      progressPercent: defaultValues?.progressPercent ?? 0,
      teamSize: defaultValues?.teamSize ?? undefined,
      criticality: defaultValues?.criticality ?? "MEDIUM",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="owner">Responsável *</Label>
          <Input id="owner" {...register("owner")} />
          {errors.owner && (
            <p className="text-destructive text-sm">{errors.owner.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="teamSize">Tamanho da equipe</Label>
          <Input id="teamSize" type="number" min={1} {...register("teamSize")} />
          {errors.teamSize && (
            <p className="text-destructive text-sm">{errors.teamSize.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Data de início *</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-destructive text-sm">{errors.startDate.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">Data prevista de término</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-destructive text-sm">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="progressPercent">Progresso (%)</Label>
          <Input
            id="progressPercent"
            type="number"
            min={0}
            max={100}
            {...register("progressPercent")}
          />
          {errors.progressPercent && (
            <p className="text-destructive text-sm">{errors.progressPercent.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Label>Criticidade</Label>
          <Controller
            control={control}
            name="criticality"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {criticalityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...register("notes")} />
        {errors.notes && (
          <p className="text-destructive text-sm">{errors.notes.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="justify-self-start">
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
