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
  RISK_CATEGORY,
  RISK_CATEGORY_LABELS,
  RISK_STATUS,
  RISK_STATUS_LABELS,
} from "@/lib/enums";
import { riskSchema, type RiskInput } from "@/lib/validation/risk";
import type { Risk } from "@/types/api";

const categoryOptions = asOptions(RISK_CATEGORY, RISK_CATEGORY_LABELS);
const statusOptions = asOptions(RISK_STATUS, RISK_STATUS_LABELS);
const scaleOptions = [1, 2, 3, 4, 5];

export function RiskForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<Risk>;
  onSubmit: (values: RiskInput) => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RiskInput>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "TECHNOLOGY",
      probability: defaultValues?.probability ?? 3,
      impact: defaultValues?.impact ?? 3,
      owner: defaultValues?.owner ?? "",
      mitigationStrategy: defaultValues?.mitigationStrategy ?? "",
      status: defaultValues?.status ?? "OPEN",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="r-title">Título *</Label>
        <Input id="r-title" {...register("title")} />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="r-description">Descrição</Label>
        <Textarea id="r-description" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="r-owner">Responsável *</Label>
          <Input id="r-owner" {...register("owner")} />
          {errors.owner && (
            <p className="text-destructive text-sm">{errors.owner.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Categoria</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
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

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Probabilidade (1-5)</Label>
          <Controller
            control={control}
            name="probability"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scaleOptions.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Label>Impacto (1-5)</Label>
          <Controller
            control={control}
            name="impact"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scaleOptions.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
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

      <div className="grid gap-2">
        <Label htmlFor="r-mitigation">Estratégia de mitigação</Label>
        <Textarea id="r-mitigation" {...register("mitigationStrategy")} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="justify-self-start">
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
