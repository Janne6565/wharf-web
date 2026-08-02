import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { safeRedirect } from "@/auth/redirectTo";
import { SetPasswordPage } from "@/pages/SetPassword";

// First-time onboarding for an OAuth account (hasVault=false): choose the
// master password that encrypts the vault. The page itself routes forward to
// /unlock when the profile says a vault already exists.
// Optional: the destination a guard is carrying forward, already validated.
interface SetPasswordSearch {
  readonly redirect?: string;
}

export const Route = createFileRoute("/set-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SetPasswordSearch => ({
    redirect: safeRedirect(search.redirect),
  }),
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: SetPasswordPage,
});
