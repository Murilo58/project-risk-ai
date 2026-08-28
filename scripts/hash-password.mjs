#!/usr/bin/env node
// One-off local helper to generate AUTH_ADMIN_PASSWORD_HASH — never run this
// against a real password in a shared/CI environment, and never commit its
// output anywhere other than an environment variable. See README.md
// "Configuração" for the full provisioning flow.
//
// Usage: node scripts/hash-password.mjs
// The password is typed into the terminal and is NOT masked — run this in a
// private terminal session.
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline/promises";

const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question(
  "Senha do administrador (será exibida em texto puro): ",
);
rl.close();

if (!password) {
  console.error("Nenhuma senha informada.");
  process.exit(1);
}

console.log("\nAUTH_ADMIN_PASSWORD_HASH=" + hashPassword(password));
console.log(
  "\nCole este valor (e o e-mail correspondente em AUTH_ADMIN_EMAIL) nas variáveis de " +
    "ambiente locais (.env) e/ou da Vercel. Nunca versione a senha em texto puro ou este hash.",
);
