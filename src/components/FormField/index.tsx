import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  // Optional slot rendered directly below the input (e.g. a strength meter).
  readonly below?: ReactNode;
}

// Shared form input wrapper — the only way inputs are rendered (REACT.md). Owns
// the label, the 44px terminal-styled field, focus/error states, and the error
// message; validation itself comes from src/lib/validators.ts via the caller.
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, below, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] text-muted">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-11 w-full rounded-input border bg-input px-3.5 text-[15px] text-text outline-none transition-colors",
            "placeholder:text-dim focus:border-accent",
            error ? "border-danger" : "border-border",
            className,
          )}
          {...rest}
        />
        {below}
        {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";
