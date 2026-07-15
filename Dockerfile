# --- Build stage: Bun installs deps and builds the TanStack Start app ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# vite build runs the TanStack Start + Nitro plugin, emitting a self-contained
# Node server bundle at .output/server/index.mjs (Nitro bundles node_modules in).
RUN bun run build

# --- Runtime stage: small Node image runs the Nitro server as non-root ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
# Only the built output is needed at runtime — it is fully self-contained.
COPY --from=build /app/.output ./.output
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
