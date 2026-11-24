import { defineConfig } from "vitest/config";

/** Hermetic unit tests only — the navigation model is pure state, no DOM, no network. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
