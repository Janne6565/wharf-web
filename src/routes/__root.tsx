import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  // Run the one-time silent refresh before any child guard evaluates, so route
  // guards see a resolved session. No-op on the server (client-only concern).
  beforeLoad: async () => {
    await ensureSessionBootstrapped();
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
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
