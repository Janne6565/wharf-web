import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "warning" | "danger";

interface AlertProps {
  readonly tone: Tone;
  readonly children: ReactNode;
  readonly className?: string;
}

const TONES: Record<Tone, string> = {
  warning: "bg-warn-bg border-warn-border text-warn",
  danger: "bg-danger-bg border-danger-border text-danger",
};

// The amber (warning) / red (danger) callout boxes from the design.
export function Alert({ tone, children, className }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={cn(
        "rounded-input border px-4 py-3 text-[13.5px] leading-relaxed",
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
