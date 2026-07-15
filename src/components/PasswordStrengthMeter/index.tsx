import { STRENGTH_SEGMENTS, type StrengthScore } from "@/lib/passwordStrength";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  readonly score: StrengthScore;
}

// The four-segment strength meter, fused to the master-password field's bottom
// edge inside its border: a border-top separator, then four gapless 4px
// segments — lit turn green, unlit stay near-black. Purely presentational — the
// score is computed by src/lib/passwordStrength.ts.
export function PasswordStrengthMeter({ score }: PasswordStrengthMeterProps) {
  return (
    <div className="flex border-t border-border">
      {Array.from({ length: STRENGTH_SEGMENTS }, (_, index) => (
        <span
          // Fixed set of meter segments; index is their stable identity.
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed meter segments
          key={index}
          className={cn(
            "h-1 flex-1 transition-colors",
            index < score ? "bg-success" : "bg-meter-empty",
          )}
        />
      ))}
    </div>
  );
}
