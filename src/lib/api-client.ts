export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];
  retryAfterSeconds?: number;

  constructor(
    status: number,
    message: string,
    issues?: { path: string; message: string }[],
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error ?? "Erro inesperado ao comunicar com o servidor.",
      body?.issues,
      body?.retryAfterSeconds,
    );
  }

  return body as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (url: string) => request<void>(url, { method: "DELETE" }),
};
