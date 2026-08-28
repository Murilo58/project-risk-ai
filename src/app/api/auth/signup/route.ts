import { toErrorResponse, ValidationError } from "@/lib/api-errors";
import { createUser } from "@/lib/auth/credentials";
import { buildSessionCookieHeader, createSessionToken } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const user = await createUser(parsed.data);

    const token = await createSessionToken(user.id);
    return Response.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201, headers: { "Set-Cookie": buildSessionCookieHeader(token) } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
