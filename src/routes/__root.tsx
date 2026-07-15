import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ensureSessionBootstrapped } from "@/auth/session";
// Side-effect import: initialises i18next once so useTranslation works app-wide.
import "@/i18n/config";
import { queryClient } from "@/queryClient";
import { store } from "@/store";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "wharf — sign in" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  // Run the one-time silent refresh before any child guard evaluates, so route
  // guards see a resolved session. No-op on the server (client-only concern).
  beforeLoad: async () => {
    await ensureSessionBootstrapped();
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  // The root beforeLoad runs the silent refresh on the server (a no-op there)
  // and its result is dehydrated, so it does NOT re-run on initial client
  // hydration. Without this, the session stays "anonymous" until a later
  // navigation or link preload (e.g. hovering a <Link>) re-triggers beforeLoad —
  // which is why signed-in state used to appear only on hover. The bootstrap is
  // memoized, so this composes with the beforeLoad path without a double
  // refresh.
  useEffect(() => {
    void ensureSessionBootstrapped();
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ReduxProvider>
        <Scripts />
      </body>
    </html>
  );
}
