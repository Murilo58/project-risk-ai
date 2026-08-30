// Optimistic auth gate — see ARCHITECTURE.md §12. This runs on every route
// (Node.js runtime by default in this Next.js version) and only reads the
// signed session cookie, no database access, so it stays fast even on
// prefetched navigations. It complements, but does not replace, the
// `requireSession()` check performed inside each protected Route Handler.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PAGE_PATHS = new Set(["/login", "/signup"]);
// The home page is rendered for everyone, authenticated or not: it is a client
// component whose portfolio data comes from `/api/dashboard` (still 401-gated),
// so its HTML carries only a generic shell plus the Open Graph / Twitter
// metadata that social link crawlers need. Logged-out humans are bounced to
// `/login` client-side by the page itself.
const PUBLICLY_RENDERABLE_PAGE_PATHS = new Set(["/"]);
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/signup",
  // Logout must work even with an expired/invalid/missing session — the
  // whole point is to clear whatever cookie the browser has, and a user
  // stuck with a stale session would otherwise be unable to reach the
  // endpoint that fixes that.
  "/api/auth/logout",
  "/api/cron/health-snapshot",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (PUBLICLY_RENDERABLE_PAGE_PATHS.has(pathname)) {
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
  // `opengraph-image` / `twitter-image` are public social-preview assets and
  // `robots.txt` is fetched by crawlers before scraping — all bypass the auth
  // gate just like `favicon.ico`, so a crawler never gets a login redirect
  // where it expects an asset.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|robots.txt).*)",
  ],
};
