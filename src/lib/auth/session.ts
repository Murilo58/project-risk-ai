// Stateless session tokens — see ARCHITECTURE.md §12. The token's subject
// (`sub`) is the real `User.id` from Postgres; the token itself carries no
// other user data (name/e-mail are looked up from the DB when needed), and
// is never queried against the database to verify — it's authenticated
// purely by its signature and expiry, so verifying a session never requires
// a DB round trip.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "prai_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Imported as a `CryptoKey` (via Web Crypto) rather than passed as a raw
// `Uint8Array` — jose's WebCrypto build (used under jsdom/Edge runtimes,
// as opposed to its Node build) only accepts `CryptoKey` for HMAC signing.
// Cached because AUTH_SECRET never changes during the process lifetime.
let cachedKey: CryptoKey | null = null;
let cachedSecret: string | null = null;

async function getSecretKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está configurada.");
  }
  if (cachedKey && cachedSecret === secret) return cachedKey;

  cachedKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  cachedSecret = secret;
  return cachedKey;
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(await getSecretKey());
}

export type Session = { userId: string };

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, await getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

// `Set-Cookie` headers are built manually (not via `next/headers`'s
// `cookies()`) so login/logout stay plain Route Handlers that work the same
// way whether dispatched by Next.js or invoked directly with a hand-built
// `Request`, as the existing integration tests do.
function cookieAttributes(maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function buildSessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(SESSION_DURATION_SECONDS)}`;
}

export function buildClearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; ${cookieAttributes(0)}`;
}

// Minimal manual parse of the `Cookie` request header — deliberately NOT
// using `next/headers`'s `cookies()` here, so this also works when a Route
// Handler is invoked directly with a hand-built `Request` (as the existing
// integration tests do), outside of a real Next.js request lifecycle.
export function readSessionTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    const name = part.slice(0, separatorIndex).trim();
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }
  return null;
}
