#!/usr/bin/env node
// One-off data migration: assigns every pre-existing Project row (created
// before per-user ownership existed, so userId is still NULL) to a single
// chosen User account. Safe to run more than once — it only ever touches
// rows where "userId" IS NULL, so already-assigned projects are untouched.
//
// Run this AFTER the target user has signed up through the app (so the
// account already exists), and BEFORE making Project.userId required in
// the schema. See ARCHITECTURE.md §12 for the full migration sequence.
//
// Usage: node scripts/backfill-project-owner.mjs
import "dotenv/config";
import readline from "node:readline/promises";
import { Client } from "pg";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const email = (
  await rl.question("E-mail do usuário que será dono dos projetos existentes: ")
).trim();
rl.close();

if (!email) {
  console.error("Nenhum e-mail informado.");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const userResult = await client.query(
    'SELECT id, email FROM "User" WHERE lower(email) = lower($1)',
    [email],
  );
  const user = userResult.rows[0];
  if (!user) {
    console.error(
      `\nNenhum usuário encontrado com o e-mail "${email}". Cadastre-se pela tela /signup primeiro, depois rode este script de novo.`,
    );
    process.exit(1);
  }

  const pendingResult = await client.query(
    'SELECT count(*) FROM "Project" WHERE "userId" IS NULL',
  );
  const pendingCount = Number(pendingResult.rows[0].count);

  if (pendingCount === 0) {
    console.log("\nNenhum projeto sem dono encontrado. Nada para fazer.");
  } else {
    const updateResult = await client.query(
      'UPDATE "Project" SET "userId" = $1 WHERE "userId" IS NULL',
      [user.id],
    );
    console.log(
      `\n${updateResult.rowCount} projeto(s) associados a ${user.email} (id: ${user.id}).`,
    );
  }
} finally {
  await client.end();
}
