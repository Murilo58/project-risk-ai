"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projetos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login" || pathname === "/signup") return null;

  async function handleLogout() {
    await api.post("/api/auth/logout", {});
    // A stale client-side cache after this point is harmless: `proxy.ts`
    // redirects any protected page straight back to /login once the
    // session cookie is gone, before that cache could ever be shown.
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Project Risk AI
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleLogout()}
            className="ml-1 text-blue-100 hover:bg-white/10 hover:text-white"
          >
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
}
