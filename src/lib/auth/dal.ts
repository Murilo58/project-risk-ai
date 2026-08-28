// Data Access Layer entry point for authorization — call this at the start
// of every protected Route Handler. This is the "secure" check (close to
// the data) that must hold even if `proxy.ts`'s optimistic check is ever
// bypassed by a routing change — see the Next.js authentication guide.
import { UnauthorizedError } from "@/lib/api-errors";
import { readSessionTokenFromRequest, verifySessionToken } from "@/lib/auth/session";

export async function requireSession(request: Request): Promise<void> {
  const token = readSessionTokenFromRequest(request);
  const isValid = token ? await verifySessionToken(token) : false;
  if (!isValid) {
    throw new UnauthorizedError();
  }
}
