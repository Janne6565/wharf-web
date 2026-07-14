import type { ReactNode } from "react";

interface CardProps {
  readonly children: ReactNode;
  // Exact max width in px per the design (signup 440, device 460, recover 480,
  // recovery-code 520, signin 420). Passed as an inline max-width because it is
  // an exact, per-screen value rather than a shared design token.
  readonly maxWidth: number;
}

// The dark card container shared by every screen: 1px border, 16px radius, 32px
// padding, centered.
export function Card({ children, maxWidth }: CardProps) {
  return (
    <div
      className="mx-auto w-full rounded-card border border-border bg-card p-8"
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
}
