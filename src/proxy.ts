// Optimistic auth gate — see ARCHITECTURE.md §12. This runs on every route
// (Node.js runtime by default in this Next.js version) and only reads the
// signed session cookie, no database access, so it stays fast even on
// prefetched navigations. It complements, but does not replace, the
// `requireSession()` check performed inside each protected Route Handler.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PAGE_PATHS = new Set(["/login", "/signup"]);
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/cron/health-snapshot",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = token ? (await verifySessionToken(token)) !== null : false;

  if (PUBLIC_PAGE_PATHS.has(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (isApiRoute) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
