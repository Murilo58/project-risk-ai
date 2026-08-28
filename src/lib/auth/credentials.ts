// Single-admin credential check for the MVP — no `User` table (see
// ARCHITECTURE.md §9). The admin e-mail/password hash are provisioned as
// environment variables; see scripts/hash-password.mjs to generate the hash.
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

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
// AUTH_ADMIN_EMAIL — avoids leaking, via response time, whether a given
// e-mail is the configured admin account.
const DUMMY_HASH = hashPassword("not-the-real-password");

export function verifyCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.AUTH_ADMIN_EMAIL;
  const adminPasswordHash = process.env.AUTH_ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminPasswordHash) return false;

  const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passwordMatches = verifyPassword(
    password,
    emailMatches ? adminPasswordHash : DUMMY_HASH,
  );

  return emailMatches && passwordMatches;
}
