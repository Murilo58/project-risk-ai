import { describe, expect, it } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "@/test/auth";

function loginRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function parseCookieValue(setCookieHeader: string): string {
  const [pair] = setCookieHeader.split(";");
  const separatorIndex = pair.indexOf("=");
  return pair.slice(separatorIndex + 1);
}

describe("POST /api/auth/login", () => {
  it("sets a valid session cookie for correct credentials", async () => {
    const response = await login(
      loginRequest({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
    );
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain(SESSION_COOKIE_NAME);

    const token = parseCookieValue(setCookie!);
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("rejects an invalid password", async () => {
    const response = await login(
      loginRequest({ email: TEST_ADMIN_EMAIL, password: "wrong-password" }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects an unknown e-mail", async () => {
    const response = await login(
      loginRequest({ email: "someone-else@example.com", password: TEST_ADMIN_PASSWORD }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 for a malformed payload", async () => {
    const response = await login(loginRequest({ email: "not-an-email", password: "" }));
    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const response = await logout();
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain("Max-Age=0");
  });
});
