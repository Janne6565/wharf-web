import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly label: string;
  readonly id?: string;
  readonly "data-testid"?: string;
}

// A labelled checkbox: filled accent square with a dark check when on, outlined
// dim square when off (matching the design). Wraps a visually-hidden native
// input so it stays keyboard- and screen-reader accessible.
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
  "data-testid": testId,
}: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        data-testid={testId}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-4 flex-none items-center justify-center transition-colors",
          checked ? "bg-accent text-accent-ink" : "border border-dim text-transparent",
        )}
      >
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="text-[12.5px] leading-snug text-muted">{label}</span>
    </label>
  );
}
