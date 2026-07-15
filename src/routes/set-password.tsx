import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { SetPasswordPage } from "@/pages/SetPassword";

// First-time onboarding for an OAuth account (hasVault=false): choose the
// master password that encrypts the vault. The page itself routes forward to
// /unlock when the profile says a vault already exists.
export const Route = createFileRoute("/set-password")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: SetPasswordPage,
});
