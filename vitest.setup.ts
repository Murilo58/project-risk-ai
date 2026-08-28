import "dotenv/config";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";

import { prisma } from "@/lib/prisma";

// Always overridden here (not just defaulted) so the test suite never
// depends on whatever a developer's local .env happens to define — tests
// stay hermetic and reproducible in CI.
process.env.AUTH_SECRET = "test-only-secret-do-not-use-in-production";

afterEach(() => {
  cleanup();
});

// Each test file gets its own module registry, so its own PrismaClient (and
// underlying pg.Pool). Without this, connections pile up across files and
// exhaust the connection_limit of local dev databases (e.g. `prisma dev`).
afterAll(async () => {
  await prisma.$disconnect();
});
