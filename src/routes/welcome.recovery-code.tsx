import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { getPendingRecoveryCode } from "@/auth/recoveryHandoff";
import { RecoveryCodePage } from "@/pages/RecoveryCode";

// The recovery code is held only in memory (never persisted). A direct visit or
// a page reload loses it, so bounce back to sign-up rather than show an empty
// screen — the code is genuinely shown once.
export const Route = createFileRoute("/welcome/recovery-code")({
  ssr: false,
  beforeLoad: () => {
    requireAuth();
    if (typeof window !== "undefined" && !getPendingRecoveryCode()) {
      throw redirect({ to: "/signup" });
    }
  },
  component: RecoveryCodePage,
});
