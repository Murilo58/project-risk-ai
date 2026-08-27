import { z } from "zod";

// <input type="date"> posts "" when cleared; treat that (and null/undefined) as
// "not provided" instead of letting it fail date coercion.
export const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional(),
);

export const requiredDate = z.coerce.date({ error: "Data inválida." });

export const requiredText = (label: string, max = 255) =>
  z
    .string({ error: `${label} é obrigatório.` })
    .trim()
    .min(1, { error: `${label} é obrigatório.` })
    .max(max, { error: `${label} deve ter no máximo ${max} caracteres.` });

export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, { error: `Deve ter no máximo ${max} caracteres.` })
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value));
