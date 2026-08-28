import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hashPassword, verifyCredentials } from "@/lib/auth/credentials";

describe("verifyCredentials", () => {
  const originalEmail = process.env.AUTH_ADMIN_EMAIL;
  const originalHash = process.env.AUTH_ADMIN_PASSWORD_HASH;

  beforeEach(() => {
    process.env.AUTH_ADMIN_EMAIL = "admin@example.com";
    process.env.AUTH_ADMIN_PASSWORD_HASH = hashPassword("correct-password");
  });

  afterEach(() => {
    process.env.AUTH_ADMIN_EMAIL = originalEmail;
    process.env.AUTH_ADMIN_PASSWORD_HASH = originalHash;
  });

  it("accepts the correct e-mail and password", () => {
    expect(verifyCredentials("admin@example.com", "correct-password")).toBe(true);
  });

  it("is case-insensitive on e-mail", () => {
    expect(verifyCredentials("Admin@Example.com", "correct-password")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyCredentials("admin@example.com", "wrong-password")).toBe(false);
  });

  it("rejects a wrong e-mail", () => {
    expect(verifyCredentials("someone-else@example.com", "correct-password")).toBe(false);
  });

  it("rejects everything when AUTH_ADMIN_EMAIL is not configured", () => {
    delete process.env.AUTH_ADMIN_EMAIL;
    expect(verifyCredentials("admin@example.com", "correct-password")).toBe(false);
  });

  it("rejects everything when AUTH_ADMIN_PASSWORD_HASH is not configured", () => {
    delete process.env.AUTH_ADMIN_PASSWORD_HASH;
    expect(verifyCredentials("admin@example.com", "correct-password")).toBe(false);
  });
});

describe("hashPassword", () => {
  it("produces a salt:hash pair that verifyCredentials can check", () => {
    const hash = hashPassword("another-password");
    expect(hash.split(":")).toHaveLength(2);
  });

  it("produces a different hash each time (random salt)", () => {
    expect(hashPassword("same-password")).not.toBe(hashPassword("same-password"));
  });
});
