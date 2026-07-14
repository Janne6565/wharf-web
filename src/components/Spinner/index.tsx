import { cn } from "@/lib/utils";

interface SpinnerProps {
  readonly className?: string;
}

// A minimal inline spinner used inside buttons during pending requests.
export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
