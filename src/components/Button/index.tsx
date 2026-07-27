import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "danger-outline" | "ghost";

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
  // Red outline: the same destructive action where the stakes are low enough
  // that a solid block would be shouting.
  "danger-outline":
    "h-[42px] border border-danger text-[13px] font-bold text-danger hover:bg-danger hover:text-danger-ink disabled:border-border disabled:text-dim disabled:hover:bg-transparent",
  // Solid red: only for a control that destroys something irreversibly.
  danger:
    "h-12 bg-danger text-[14px] font-bold text-danger-ink hover:bg-danger/90 disabled:border disabled:border-border disabled:bg-disabled-bg disabled:text-dim",
  ghost: "h-[42px] text-[13px] text-muted hover:text-text",
};

// The cancel half of a submit + cancel row. The secondary variant is 42px tall
// on its own, so pairing it with a 48px primary reads as a misaligned row; and
// next to a w-full submit it needs shrink-0, or the flex row squeezes it until
// its label wraps.
export const PAIRED_CANCEL_CLASS = "h-12 w-auto shrink-0 px-4";

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
        // whitespace-nowrap: the bracketed label is three text nodes, so a
        // squeezed button would otherwise break "[ cancel ]" across two lines.
        "flex w-full items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:cursor-not-allowed",
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
