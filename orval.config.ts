import { defineConfig } from "orval";

// Generates a fully-typed Axios client from the backend's committed OpenAPI
// spec into src/api/generated/ (a build artefact — committed, never hand-edited).
// Every call routes through the shared customInstance mutator (Bearer token +
// silent refresh). Run `bun gen:api` after the spec changes.
export default defineConfig({
  wharf: {
    input: {
      target: "../wharf-backend/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/model",
      client: "axios",
      httpClient: "axios",
      clean: true,
      indexFiles: true,
      override: {
        mutator: {
          path: "src/api/axios-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
