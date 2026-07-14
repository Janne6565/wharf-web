import { QueryClient } from "@tanstack/react-query";

// A single QueryClient for the app. Retries are disabled by default: the auth
// mutations here are not idempotent-safe to blindly retry (e.g. register), and
// each screen surfaces its own error state.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
