import { afterEach, describe, expect, it } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as signup } from "@/app/api/auth/signup/route";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function loginRequest(body: unknown): Request {
  return jsonRequest("http://localhost/api/auth/login", body);
}

function signupRequest(body: unknown): Request {
  return jsonRequest("http://localhost/api/auth/signup", body);
}

function parseCookieValue(setCookieHeader: string): string {
  const [pair] = setCookieHeader.split(";");
  const separatorIndex = pair.indexOf("=");
  return pair.slice(separatorIndex + 1);
}

describe("POST /api/auth/signup", () => {
  it("creates a user and sets a valid session cookie for it", async () => {
    const response = await signup(
      signupRequest({
        name: "Nova Conta",
        email: "signup-success@example.com",
        password: "correct-password",
      }),
    );
    expect(response.status).toBe(201);

    const body = await response.json();
    createdUserIds.push(body.id);
    expect(body.email).toBe("signup-success@example.com");

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain(SESSION_COOKIE_NAME);

    const session = await verifySessionToken(parseCookieValue(setCookie!));
    expect(session?.userId).toBe(body.id);
  });

  it("rejects a duplicate e-mail", async () => {
    const user = await createUser({
      name: "Já Existe",
      email: "signup-duplicate@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    const response = await signup(
      signupRequest({
        name: "Outra Pessoa",
        email: "signup-duplicate@example.com",
        password: "another-password",
      }),
    );
    expect(response.status).toBe(409);
  });

  it("returns 400 for a weak password", async () => {
    const response = await signup(
      signupRequest({ name: "Nome", email: "weak@example.com", password: "short" }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for a malformed e-mail", async () => {
    const response = await signup(
      signupRequest({
        name: "Nome",
        email: "not-an-email",
        password: "correct-password",
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  async function createTestUser() {
    const user = await createUser({
      name: "Usuário de Teste",
      email: "login-test@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);
    return user;
  }

  it("sets a valid session cookie for correct credentials", async () => {
    const user = await createTestUser();

    const response = await login(
      loginRequest({ email: "login-test@example.com", password: "correct-password" }),
    );
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain(SESSION_COOKIE_NAME);

    const session = await verifySessionToken(parseCookieValue(setCookie!));
    expect(session?.userId).toBe(user.id);
  });

  it("rejects an invalid password", async () => {
    await createTestUser();

    const response = await login(
      loginRequest({ email: "login-test@example.com", password: "wrong-password" }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects an unknown e-mail", async () => {
    const response = await login(
      loginRequest({ email: "someone-else@example.com", password: "correct-password" }),
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
