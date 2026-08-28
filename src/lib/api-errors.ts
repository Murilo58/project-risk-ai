import { ZodError } from "zod";

export class NotFoundError extends Error {
  constructor(message = "Recurso não encontrado.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Não autenticado.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  issues: { path: string; message: string }[];

  constructor(zodError: ZodError) {
    super("Dados inválidos.");
    this.name = "ValidationError";
    this.issues = zodError.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message, issues: error.issues }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return Response.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  console.error(error);
  return Response.json({ error: "Erro interno inesperado." }, { status: 500 });
}
