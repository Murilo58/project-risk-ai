import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string({ error: "Senha é obrigatória." }).min(1, {
    error: "Senha é obrigatória.",
  }),
});

export type LoginInput = z.input<typeof loginSchema>;

export const signupSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório." })
    .trim()
    .min(1, { error: "Nome é obrigatório." })
    .max(200, { error: "Nome deve ter no máximo 200 caracteres." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z
    .string({ error: "Senha é obrigatória." })
    .min(8, { error: "A senha deve ter pelo menos 8 caracteres." }),
});

export type SignupInput = z.input<typeof signupSchema>;
