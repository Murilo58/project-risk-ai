// Multi-user credentials, backed by the `User` table (see ARCHITECTURE.md
// §12 — supersedes the earlier single-admin, env-var-only model).
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { ConflictError } from "@/lib/api-errors";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, derivedKeyHex] = storedHash.split(":");
  if (!salt || !derivedKeyHex) return false;

  const storedKey = Buffer.from(derivedKeyHex, "hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  if (storedKey.length !== derivedKey.length) return false;

  return timingSafeEqual(derivedKey, storedKey);
}

// A hash with a valid shape but no real match, used to keep the password
// verification cost constant even when the submitted e-mail doesn't match
// any user — avoids leaking, via response time, whether a given e-mail is
// registered.
const DUMMY_HASH = hashPassword("not-a-real-password");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type PublicUser = { id: string; name: string; email: string };

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(data.email);
  const passwordHash = hashPassword(data.password);

  try {
    return await prisma.user.create({
      data: { name: data.name.trim(), email, passwordHash },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("E-mail já cadastrado.");
    }
    throw error;
  }
}

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  const passwordMatches = verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);

  return user && passwordMatches
    ? { id: user.id, name: user.name, email: user.email }
    : null;
}
