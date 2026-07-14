import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly loading?: boolean;
  readonly children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "h-12 bg-accent text-accent-ink font-bold hover:bg-accent-strong disabled:bg-disabled-bg disabled:text-dim",
  secondary: "h-[42px] border border-border text-subtle hover:border-accent hover:text-text",
  ghost: "h-[42px] text-muted hover:text-text",
};

// Shared button: disables and shows an inline spinner while `loading`, so every
// request-triggering control gives consistent pending feedback (REACT.md).
export function Button({
  variant = "primary",
  loading = false,
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
        "flex w-full items-center justify-center gap-2 rounded-input text-[15px] transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
