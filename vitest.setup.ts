import "dotenv/config";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";

import { hashPassword } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "@/test/auth";

// Auth env vars are always overridden here (not just defaulted) so the test
// suite never depends on whatever real credentials a developer's local .env
// happens to define — tests stay hermetic and reproducible in CI.
process.env.AUTH_SECRET = "test-only-secret-do-not-use-in-production";
process.env.AUTH_ADMIN_EMAIL = TEST_ADMIN_EMAIL;
process.env.AUTH_ADMIN_PASSWORD_HASH = hashPassword(TEST_ADMIN_PASSWORD);

afterEach(() => {
  cleanup();
});

// Each test file gets its own module registry, so its own PrismaClient (and
// underlying pg.Pool). Without this, connections pile up across files and
// exhaust the connection_limit of local dev databases (e.g. `prisma dev`).
afterAll(async () => {
  await prisma.$disconnect();
});
