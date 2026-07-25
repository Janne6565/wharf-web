import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPendingRecoveryCode } from "@/auth/recoveryHandoff";
import { RecoveryCodePage } from "@/pages/RecoveryCode";

// The recovery code is held only in memory (never persisted). A direct visit or
// a page reload loses it, so bounce back to sign-up rather than show an empty
// screen — the code is genuinely shown once.
//
// Deliberately no auth guard: registration answers 202 without tokens, so the
// visitor is still anonymous here — the session is only established after email
// verification, the step that follows this one. The in-memory recovery-code
// check below is the real gate, and it is synchronous.
export const Route = createFileRoute("/welcome/recovery-code")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getPendingRecoveryCode()) {
      throw redirect({ to: "/signup" });
    }
  },
  component: RecoveryCodePage,
});
