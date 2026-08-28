// DB-backed (real Postgres) — credential verification now queries the
// `User` table rather than comparing pure in-memory values, so these can no
// longer be unit tests. See the same DB-connection caveats already noted in
// src/app/api/*/route.integration.test.ts files.
import { afterEach, describe, expect, it } from "vitest";

import { ConflictError } from "@/lib/api-errors";
import { createUser, hashPassword, verifyUserCredentials } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

describe("createUser", () => {
  it("creates a user with a hashed password, never the plaintext", async () => {
    const user = await createUser({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    expect(user.email).toBe("ada@example.com");

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored?.passwordHash).not.toBe("correct-password");
    expect(stored?.passwordHash.split(":")).toHaveLength(2);
  });

  it("normalizes e-mail to lowercase", async () => {
    const user = await createUser({
      name: "Ada",
      email: "Ada@Example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    expect(user.email).toBe("ada@example.com");
  });

  it("rejects a duplicate e-mail, case-insensitively", async () => {
    const user = await createUser({
      name: "Ada",
      email: "dup@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    await expect(
      createUser({
        name: "Outra Pessoa",
        email: "DUP@Example.com",
        password: "another-password",
      }),
    ).rejects.toThrow(ConflictError);
  });
});

describe("verifyUserCredentials", () => {
  it("accepts the correct e-mail and password", async () => {
    const user = await createUser({
      name: "Ada",
      email: "verify@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    const result = await verifyUserCredentials("verify@example.com", "correct-password");
    expect(result?.id).toBe(user.id);
  });

  it("is case-insensitive on e-mail", async () => {
    const user = await createUser({
      name: "Ada",
      email: "casetest@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    const result = await verifyUserCredentials(
      "CaseTest@Example.com",
      "correct-password",
    );
    expect(result?.id).toBe(user.id);
  });

  it("rejects a wrong password", async () => {
    const user = await createUser({
      name: "Ada",
      email: "wrongpw@example.com",
      password: "correct-password",
    });
    createdUserIds.push(user.id);

    expect(
      await verifyUserCredentials("wrongpw@example.com", "wrong-password"),
    ).toBeNull();
  });

  it("rejects an unknown e-mail", async () => {
    expect(await verifyUserCredentials("nobody@example.com", "whatever")).toBeNull();
  });
});

describe("hashPassword", () => {
  it("produces a different hash each time (random salt)", () => {
    expect(hashPassword("same-password")).not.toBe(hashPassword("same-password"));
  });
});
