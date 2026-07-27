import { Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// "mixed" is the master toggle with only some of its group on. "saving" is a
// row whose write is in flight: the knob has already moved, but the dashed
// border says the value is not stored yet — so the control is never quietly
// claiming a state the server has not accepted.
export type SwitchState = "on" | "off" | "mixed" | "saving";

interface SwitchProps {
  readonly state: SwitchState;
  readonly onToggle: () => void;
  // What the switch controls, for screen readers. The visible row title is not
  // enough on its own: a bare switch reads as "switch" with no subject.
  readonly label: string;
  readonly disabled?: boolean;
  readonly "data-testid"?: string;
}

// A square switch, matching the terminal-flavoured design: no rounding, no
// sliding animation, just a 46x24 track with an 18px block that sits at one end.
export function Switch({
  state,
  onToggle,
  label,
  disabled = false,
  "data-testid": testId,
}: SwitchProps) {
  const on = state === "on";
  const mixed = state === "mixed";
  const saving = state === "saving";
  const lit = on || mixed || saving;

  return (
    <button
      type="button"
      role="switch"
      // A mixed master toggle is aria-checked="mixed", which is what makes the
      // partial state audible rather than merely visible.
      aria-checked={mixed ? "mixed" : on}
      aria-label={label}
      aria-busy={saving || undefined}
      disabled={disabled}
      onClick={onToggle}
      data-testid={testId}
      data-state={state}
      className={cn(
        "flex h-6 w-[46px] flex-none items-center p-0.5 transition-colors",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-strong",
        disabled && "cursor-not-allowed opacity-60",
        saving && "border border-dashed border-accent bg-switch-partial-bg",
        !saving && on && "border border-accent bg-switch-on-bg",
        !saving && mixed && "border border-accent bg-switch-partial-bg",
        !saving && !lit && "border border-switch-off-border bg-switch-off-bg",
        // The knob's position *is* the state, so alignment is the one thing
        // that must differ per state rather than colour alone.
        mixed ? "justify-center" : on && !saving ? "justify-end" : "justify-start",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-[18px] items-center justify-center",
          on && !saving ? "bg-accent" : lit ? "bg-switch-partial-knob" : "bg-switch-off-knob",
        )}
      >
        {mixed ? <Minus size={12} strokeWidth={3} className="text-accent-ink" /> : null}
      </span>
    </button>
  );
}
