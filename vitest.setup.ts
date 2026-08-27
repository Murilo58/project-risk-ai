import "dotenv/config";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";

import { prisma } from "@/lib/prisma";

afterEach(() => {
  cleanup();
});

// Each test file gets its own module registry, so its own PrismaClient (and
// underlying pg.Pool). Without this, connections pile up across files and
// exhaust the connection_limit of local dev databases (e.g. `prisma dev`).
afterAll(async () => {
  await prisma.$disconnect();
});
