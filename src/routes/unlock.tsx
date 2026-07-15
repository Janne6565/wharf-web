import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { UnlockPage } from "@/pages/Unlock";

// Unlock the existing vault after an OAuth sign-in: the session is
// authenticated (refresh cookie → access token) but the vault is still sealed.
export const Route = createFileRoute("/unlock")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: UnlockPage,
});
