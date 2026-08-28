import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string({ error: "Senha é obrigatória." }).min(1, {
    error: "Senha é obrigatória.",
  }),
});

export type LoginInput = z.input<typeof loginSchema>;
