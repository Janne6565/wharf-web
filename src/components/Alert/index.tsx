import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "warning" | "danger";

interface AlertProps {
  readonly tone: Tone;
  readonly children: ReactNode;
  readonly className?: string;
  readonly "data-testid"?: string;
}

const TONES: Record<Tone, string> = {
  warning: "border-warn-border border-l-[3px] border-l-warn bg-warn-bg text-warn",
  danger: "border-danger-border border-l-[3px] border-l-danger bg-danger-bg text-danger",
};

// The amber (warning) / red (danger) callout boxes from the design: square, with
// a 3px accent-coloured left border.
export function Alert({ tone, children, className, "data-testid": testId }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      data-testid={testId}
      className={cn("border px-4 py-3 text-[12.5px] leading-relaxed", TONES[tone], className)}
    >
      {children}
    </div>
  );
}
