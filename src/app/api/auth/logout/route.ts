import { buildClearSessionCookieHeader } from "@/lib/auth/session";

export async function POST() {
  return Response.json(
    { success: true },
    { status: 200, headers: { "Set-Cookie": buildClearSessionCookieHeader() } },
  );
}
