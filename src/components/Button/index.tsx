import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly loading?: boolean;
  // Wrap the label in "[ … ]" brackets (the v2 button style). On by default;
  // pass false for a bare label.
  readonly bracket?: boolean;
  readonly children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "h-12 bg-accent text-[14px] font-bold text-accent-ink hover:bg-accent-strong disabled:border disabled:border-border disabled:bg-disabled-bg disabled:text-dim",
  secondary:
    "h-[42px] border border-border text-[13px] text-subtle hover:border-accent hover:text-text",
  ghost: "h-[42px] text-[13px] text-muted hover:text-text",
};

// Shared button: square accent (primary) / outline (secondary) block with a
// bracketed lowercase label per the v2 design. Disables and shows an inline
// spinner while `loading`, so every request-triggering control gives consistent
// pending feedback (REACT.md).
export function Button({
  variant = "primary",
  loading = false,
  bracket = true,
  disabled,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "flex w-full items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : bracket ? (
        <>
          {"[ "}
          {children}
          {" ]"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
