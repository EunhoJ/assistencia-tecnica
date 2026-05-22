import { defineConfig } from "vitest/config";

// Vitest mínimo. Story 1.4 estende com plugin React quando começar a testar
// componentes.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
