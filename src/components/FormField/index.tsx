import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "danger";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  // "danger" paints the box and its label chip red for a field that is itself a
  // destructive gate (the typed-email confirmation), independently of whether
  // the value is currently invalid.
  readonly tone?: Tone;
  // Keeps the label for screen readers but drops the notched chip, for a field
  // the design labels through its placeholder alone (the host filter).
  readonly labelHidden?: boolean;
  // Optional slot rendered inside the field box, fused to the input's bottom
  // edge (e.g. a password-strength meter).
  readonly below?: ReactNode;
  // Optional adornments inside the field box, before/after the input (e.g. a
  // search icon and a clear-filter button on the host filter).
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
}

// Shared form input wrapper — the only way inputs are rendered (REACT.md). The
// v2 field is a square fieldset: a 1px box on the page background with the label
// as a chip notched into its top border, turning accent on focus. Validation
// itself comes from src/lib/validators.ts via the caller.
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      tone = "default",
      labelHidden = false,
      below,
      leading,
      trailing,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div>
        <div
          className={cn(
            "relative flex flex-wrap items-center border bg-input transition-colors focus-within:border-accent",
            error ? "border-danger" : tone === "danger" ? "border-danger-border" : "border-border",
          )}
        >
          {leading ? <span className="pl-3.5 text-dim">{leading}</span> : null}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            className={cn(
              "peer h-[46px] min-w-0 flex-1 bg-transparent px-3.5 text-[14px] text-text outline-none placeholder:text-dim",
              className,
            )}
            {...rest}
          />
          {trailing ? <span className="pr-3">{trailing}</span> : null}
          <label
            htmlFor={fieldId}
            className={cn(
              "pointer-events-none absolute -top-[9px] left-2.5 bg-card px-1.5 text-[12px] peer-focus:text-accent",
              tone === "danger" ? "text-danger" : "text-dim",
              labelHidden && "sr-only",
            )}
          >
            {label}
          </label>
          {below ? <div className="w-full">{below}</div> : null}
        </div>
        {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";
