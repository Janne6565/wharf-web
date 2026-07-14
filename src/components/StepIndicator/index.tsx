import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type OnboardingStep = 1 | 2 | 3;

interface StepIndicatorProps {
  readonly current: OnboardingStep;
}

const SEPARATOR = "──";

// The onboarding progress row: "1 account ── 2 recovery code ── 3 connect
// device", with completed steps shown as a green check, the current step in
// accent, and upcoming steps dimmed.
export function StepIndicator({ current }: StepIndicatorProps) {
  const { t } = useTranslation();
  const steps = [t("steps.account"), t("steps.recoveryCode"), t("steps.connectDevice")];

  return (
    <div className="mt-11 flex items-center gap-3.5 font-mono text-[12.5px]">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;
        return (
          <Fragment key={label}>
            <span
              className={cn(
                done && "text-success",
                active && "text-accent",
                !done && !active && "text-dim",
              )}
            >
              {done ? "✓" : stepNumber} {label}
            </span>
            {index < steps.length - 1 ? <span className="text-border">{SEPARATOR}</span> : null}
          </Fragment>
        );
      })}
    </div>
  );
}
