"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api-client";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    try {
      await api.post("/api/auth/signup", values);
      router.push("/");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível criar a conta. Tente novamente.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="signup-name">Nome</Label>
        <Input id="signup-name" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signup-password">Senha</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2 justify-self-stretch">
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  );
}
