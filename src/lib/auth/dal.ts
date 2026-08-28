// Data Access Layer entry point for authorization — call this at the start
// of every protected Route Handler. This is the "secure" check (close to
// the data) that must hold even if `proxy.ts`'s optimistic check is ever
// bypassed by a routing change — see the Next.js authentication guide.
import { UnauthorizedError } from "@/lib/api-errors";
import {
  readSessionTokenFromRequest,
  verifySessionToken,
  type Session,
} from "@/lib/auth/session";

export async function requireSession(request: Request): Promise<Session> {
  const token = readSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}
