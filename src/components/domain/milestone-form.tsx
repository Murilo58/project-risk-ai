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
import { asOptions, MILESTONE_STATUS, MILESTONE_STATUS_LABELS } from "@/lib/enums";
import { toDateInputValue } from "@/lib/format";
import { milestoneSchema, type MilestoneInput } from "@/lib/validation/milestone";
import type { Milestone } from "@/types/api";

const statusOptions = asOptions(MILESTONE_STATUS, MILESTONE_STATUS_LABELS);

export function MilestoneForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<Milestone>;
  onSubmit: (values: MilestoneInput) => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MilestoneInput>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      plannedDate: toDateInputValue(defaultValues?.plannedDate) as unknown as Date,
      actualDate: toDateInputValue(defaultValues?.actualDate) as unknown as
        Date | undefined,
      status: defaultValues?.status ?? "PLANNED",
      owner: defaultValues?.owner ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="m-description">Descrição *</Label>
        <Input id="m-description" {...register("description")} />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="m-plannedDate">Data planejada *</Label>
          <Input id="m-plannedDate" type="date" {...register("plannedDate")} />
          {errors.plannedDate && (
            <p className="text-destructive text-sm">{errors.plannedDate.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="m-actualDate">Data realizada</Label>
          <Input id="m-actualDate" type="date" {...register("actualDate")} />
          {errors.actualDate && (
            <p className="text-destructive text-sm">{errors.actualDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="m-owner">Responsável *</Label>
          <Input id="m-owner" {...register("owner")} />
          {errors.owner && (
            <p className="text-destructive text-sm">{errors.owner.message}</p>
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
      </div>

      <Button type="submit" disabled={isSubmitting} className="justify-self-start">
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
