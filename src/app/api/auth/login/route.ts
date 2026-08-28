import { toErrorResponse, ValidationError } from "@/lib/api-errors";
import { verifyCredentials } from "@/lib/auth/credentials";
import { buildSessionCookieHeader, createSessionToken } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const { email, password } = parsed.data;
    if (!verifyCredentials(email, password)) {
      return Response.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const token = await createSessionToken();
    return Response.json(
      { success: true },
      { status: 200, headers: { "Set-Cookie": buildSessionCookieHeader(token) } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
