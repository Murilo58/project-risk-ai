import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["node_modules", ".next", "src/generated"],
    // Integration tests share a single live Postgres database and assert on
    // global row counts — running test files in parallel lets one file's
    // create/delete race another's before/after count, causing flaky
    // failures. Sequential file execution keeps those assertions reliable.
    fileParallelism: false,
  },
});
