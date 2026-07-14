import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// A standalone Vitest config: it deliberately does NOT load the TanStack Start /
// Nitro Vite plugins (which target the SSR build), keeping the unit + crypto
// suite fast and environment-agnostic. Node is the default environment so the
// crypto tests get WebCrypto (globalThis.crypto.subtle); component tests opt
// into jsdom with a per-file `// @vitest-environment jsdom` directive.
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcDir,
      "#": srcDir,
      // libsodium-wrappers ships a broken ESM entry (its .mjs imports a
      // sibling libsodium.mjs that lives in a different package). Pin the
      // working CJS build via an absolute path (bypasses package `exports`).
      "libsodium-wrappers": fileURLToPath(
        new URL(
          "./node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
