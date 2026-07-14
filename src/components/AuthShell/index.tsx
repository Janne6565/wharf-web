import type { ReactNode } from "react";
import { type OnboardingStep, StepIndicator } from "@/components/StepIndicator";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  readonly children: ReactNode;
  // When set, renders the onboarding step indicator above the card.
  readonly step?: OnboardingStep;
  // Vertical offset of the card from the top, matching each screen's design.
  readonly topGap?: "onboarding" | "signin" | "recover";
}

const TOP_GAP: Record<NonNullable<AuthShellProps["topGap"]>, string> = {
  onboarding: "mt-7",
  signin: "mt-20",
  recover: "mt-14",
};

// The page frame shared by every auth screen: full-height dark background,
// centered column, an optional step indicator, and the card slot.
export function AuthShell({ children, step, topGap = "onboarding" }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center overflow-hidden bg-bg px-4 pb-10">
      {step ? <StepIndicator current={step} /> : null}
      <div className={cn("w-full", TOP_GAP[topGap])}>{children}</div>
    </main>
  );
}
