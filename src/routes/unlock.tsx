import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { safeRedirect } from "@/auth/redirectTo";
import { UnlockPage } from "@/pages/Unlock";

// Unlock the existing vault after an OAuth sign-in: the session is
// authenticated (refresh cookie → access token) but the vault is still sealed.
// Optional: the destination a guard is carrying forward, already validated.
interface UnlockSearch {
  readonly redirect?: string;
}

export const Route = createFileRoute("/unlock")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): UnlockSearch => ({
    redirect: safeRedirect(search.redirect),
  }),
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: UnlockPage,
});
