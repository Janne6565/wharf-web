import { fileURLToPath } from "node:url";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Backend origin for the dev proxy: the Spring API on :8080. In production the
// frontend talks to VITE_API_URL (or a same-origin reverse proxy).
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? "http://localhost:8080";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // libsodium-wrappers ships a broken ESM entry (its .mjs imports a sibling
      // libsodium.mjs from a different package); pin the working CJS build.
      "libsodium-wrappers": fileURLToPath(
        new URL(
          "./node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js",
          import.meta.url,
        ),
      ),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
