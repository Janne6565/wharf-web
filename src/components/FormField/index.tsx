import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  // Optional slot rendered inside the field box, fused to the input's bottom
  // edge (e.g. a password-strength meter).
  readonly below?: ReactNode;
}

// Shared form input wrapper — the only way inputs are rendered (REACT.md). The
// v2 field is a square fieldset: a 1px box on the page background with the label
// as a chip notched into its top border, turning accent on focus. Validation
// itself comes from src/lib/validators.ts via the caller.
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, below, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div>
        <div
          className={cn(
            "relative border bg-input transition-colors focus-within:border-accent",
            error ? "border-danger" : "border-border",
          )}
        >
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            className={cn(
              "peer h-[46px] w-full bg-transparent px-3.5 text-[14px] text-text outline-none placeholder:text-dim",
              className,
            )}
            {...rest}
          />
          <label
            htmlFor={fieldId}
            className="pointer-events-none absolute -top-[9px] left-2.5 bg-card px-1.5 text-[12px] text-dim peer-focus:text-accent"
          >
            {label}
          </label>
          {below}
        </div>
        {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";
