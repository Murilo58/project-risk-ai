// Shared test-only helpers for building authenticated requests against
// Route Handlers in integration tests. AUTH_SECRET is set in
// vitest.setup.ts, independent of any local .env, so tests never depend on
// developer-machine state.
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

// A session is just a signed claim over a userId — it doesn't require that
// user to actually exist in the database, so this stays DB-free and fast
// for tests that only care about route protection, not about a specific
// user's data. Tests that exercise per-user data isolation create a real
// User row and pass its id explicitly instead.
export const DEFAULT_TEST_USER_ID = "test-user-id";

export async function authCookieHeader(
  userId: string = DEFAULT_TEST_USER_ID,
): Promise<string> {
  const token = await createSessionToken(userId);
  return `${SESSION_COOKIE_NAME}=${token}`;
}
