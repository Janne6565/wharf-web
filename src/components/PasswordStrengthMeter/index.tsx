import { STRENGTH_SEGMENTS, type StrengthScore } from "@/lib/passwordStrength";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  readonly score: StrengthScore;
}

// The four-segment strength meter under the master-password field: lit segments
// turn green, unlit stay border-coloured. Purely presentational — the score is
// computed by src/lib/passwordStrength.ts.
export function PasswordStrengthMeter({ score }: PasswordStrengthMeterProps) {
  return (
    <div className="mt-2 flex gap-1">
      {Array.from({ length: STRENGTH_SEGMENTS }, (_, index) => (
        <span
          // Fixed set of meter segments; index is their stable identity.
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed meter segments
          key={index}
          className={cn(
            "h-[3px] flex-1 rounded-sm transition-colors",
            index < score ? "bg-success" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
