import { describe, expect, it } from "vitest";

import {
  buildClearSessionCookieHeader,
  buildSessionCookieHeader,
  createSessionToken,
  readSessionTokenFromRequest,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

describe("session tokens", () => {
  it("creates a token that verifies successfully and carries the userId", async () => {
    const token = await createSessionToken("user-123");
    expect(await verifySessionToken(token)).toEqual({ userId: "user-123" });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken("user-123");
    // Flip a character in the middle of the token (well away from the
    // trailing base64url padding bits, which can tolerate some byte values
    // without changing the decoded content) so the signature reliably fails.
    const middle = Math.floor(token.length / 2);
    const replacement = token[middle] === "A" ? "B" : "A";
    const tampered = token.slice(0, middle) + replacement + token.slice(middle + 1);
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});

describe("readSessionTokenFromRequest", () => {
  it("extracts the session token from the Cookie header", async () => {
    const token = await createSessionToken("user-123");
    const request = new Request("http://localhost", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}; other=value` },
    });
    expect(readSessionTokenFromRequest(request)).toBe(token);
  });

  it("returns null when there is no Cookie header", () => {
    const request = new Request("http://localhost");
    expect(readSessionTokenFromRequest(request)).toBeNull();
  });

  it("returns null when the session cookie is absent", () => {
    const request = new Request("http://localhost", {
      headers: { Cookie: "other=value" },
    });
    expect(readSessionTokenFromRequest(request)).toBeNull();
  });
});

describe("cookie header builders", () => {
  it("builds a Set-Cookie header with the session token and security attributes", () => {
    const header = buildSessionCookieHeader("abc123");
    expect(header).toContain(`${SESSION_COOKIE_NAME}=abc123`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
  });

  it("builds a clearing Set-Cookie header with Max-Age=0", () => {
    const header = buildClearSessionCookieHeader();
    expect(header).toContain("Max-Age=0");
  });
});
