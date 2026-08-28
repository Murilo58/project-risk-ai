// Shared test-only helpers for building authenticated requests against
// Route Handlers in integration tests. Credentials/secret are set in
// vitest.setup.ts, independent of any local .env, so tests never depend on
// developer-machine state.
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const TEST_ADMIN_EMAIL = "admin@example.com";
export const TEST_ADMIN_PASSWORD = "correct horse battery staple";

export async function authCookieHeader(): Promise<string> {
  const token = await createSessionToken();
  return `${SESSION_COOKIE_NAME}=${token}`;
}
