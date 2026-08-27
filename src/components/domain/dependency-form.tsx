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
import {
  asOptions,
  CRITICALITY,
  CRITICALITY_LABELS,
  DEPENDENCY_STATUS,
  DEPENDENCY_STATUS_LABELS,
  DEPENDENCY_TYPE,
  DEPENDENCY_TYPE_LABELS,
} from "@/lib/enums";
import { dependencySchema, type DependencyInput } from "@/lib/validation/dependency";
import type { Dependency } from "@/types/api";

const typeOptions = asOptions(DEPENDENCY_TYPE, DEPENDENCY_TYPE_LABELS);
const criticalityOptions = asOptions(CRITICALITY, CRITICALITY_LABELS);
const statusOptions = asOptions(DEPENDENCY_STATUS, DEPENDENCY_STATUS_LABELS);

export function DependencyForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<Dependency>;
  onSubmit: (values: DependencyInput) => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DependencyInput>({
    resolver: zodResolver(dependencySchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      type: defaultValues?.type ?? "INTERNAL",
      owner: defaultValues?.owner ?? "",
      criticality: defaultValues?.criticality ?? "MEDIUM",
      status: defaultValues?.status ?? "OPEN",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="d-description">Descrição *</Label>
        <Input id="d-description" {...register("description")} />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="d-owner">Responsável *</Label>
          <Input id="d-owner" {...register("owner")} />
          {errors.owner && (
            <p className="text-destructive text-sm">{errors.owner.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
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

      <div className="grid grid-cols-2 gap-4">
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
