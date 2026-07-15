import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { type OnboardingStep, StepIndicator } from "@/components/StepIndicator";

interface AuthShellProps {
  readonly children: ReactNode;
  // When set, renders the onboarding step indicator above the card.
  readonly step?: OnboardingStep;
  // When set, renders a bordered back link (ArrowLeft icon + "back") pinned to
  // the top-left of the screen.
  readonly backTo?: string;
}

// The page frame shared by every auth screen: full-height dark background, all
// monospace (v2), and a centered column holding an optional step indicator and
// the card slot. The card is vertically centered so it reads the same on every
// screen regardless of its height.
export function AuthShell({ children, step, backTo }: AuthShellProps) {
  const { t } = useTranslation();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-bg px-4 py-10 font-mono sm:gap-8">
      {backTo ? (
        <Link
          to={backTo}
          data-testid="auth-back"
          className="absolute top-4 left-4 flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-[13px] text-muted hover:border-accent hover:text-accent sm:top-6 sm:left-7"
        >
          <ArrowLeft size={14} aria-hidden />
          {t("common.back")}
        </Link>
      ) : null}
      {step ? <StepIndicator current={step} /> : null}
      <div className="w-full">{children}</div>
    </main>
  );
}
