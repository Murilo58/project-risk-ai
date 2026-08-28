import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";
import { authCookieHeader } from "@/test/auth";

describe("proxy — unauthenticated", () => {
  it("redirects a protected page to /login", async () => {
    const response = await proxy(new NextRequest("http://localhost/projects"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects the dashboard (root) to /login", async () => {
    const response = await proxy(new NextRequest("http://localhost/"));
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("returns 401 JSON for a protected API route", async () => {
    const response = await proxy(new NextRequest("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
  });

  it("allows access to the login page itself", async () => {
    const response = await proxy(new NextRequest("http://localhost/login"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows the login API endpoint without a session", async () => {
    const response = await proxy(new NextRequest("http://localhost/api/auth/login"));
    expect(response.status).not.toBe(401);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows the cron endpoint without a user session (it has its own secret check)", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/api/cron/health-snapshot"),
    );
    expect(response.status).not.toBe(401);
    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy — authenticated", () => {
  it("passes through a protected page", async () => {
    const cookie = await authCookieHeader();
    const response = await proxy(
      new NextRequest("http://localhost/projects", { headers: { Cookie: cookie } }),
    );
    expect(response.headers.get("location")).toBeNull();
  });

  it("passes through a protected API route", async () => {
    const cookie = await authCookieHeader();
    const response = await proxy(
      new NextRequest("http://localhost/api/dashboard", { headers: { Cookie: cookie } }),
    );
    expect(response.status).not.toBe(401);
  });

  it("redirects away from /login back to /", async () => {
    const cookie = await authCookieHeader();
    const response = await proxy(
      new NextRequest("http://localhost/login", { headers: { Cookie: cookie } }),
    );
    expect(response.headers.get("location")).toBe("http://localhost/");
  });
});
