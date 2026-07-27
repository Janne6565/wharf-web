import type { ReactNode } from "react";
import { BackLink } from "@/components/BackLink";
import { type OnboardingStep, StepIndicator } from "@/components/StepIndicator";

interface AuthShellProps {
  readonly children: ReactNode;
  // When set, renders the onboarding step indicator above the card.
  readonly step?: OnboardingStep;
  // When set, renders the shared <BackLink> pinned to the top-left of the
  // screen. Screens framed by this shell must not render their own — this is
  // the only back control they get.
  readonly backTo?: string;
}

// The page frame shared by every auth screen: full-height dark background, all
// monospace (v2), and a centered column holding an optional step indicator and
// the card slot. The card is vertically centered so it reads the same on every
// screen regardless of its height.
export function AuthShell({ children, step, backTo }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-bg px-4 py-10 font-mono sm:gap-8">
      {backTo ? <BackLink to={backTo} placement="pinned" /> : null}
      {step ? <StepIndicator current={step} /> : null}
      <div className="w-full">{children}</div>
    </main>
  );
}
