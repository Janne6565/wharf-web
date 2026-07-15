import type { ReactNode } from "react";

interface CardProps {
  readonly children: ReactNode;
  // The floating label chip that sits on the card's top border (e.g. "sign up",
  // "recover vault"). One per screen, per the v2 design.
  readonly label: string;
  // Exact width in px per the design (signup 460, recovery-code 540, device 480,
  // signin 440, recover 500). Passed as an inline max-width because it is an
  // exact, per-screen value rather than a shared design token.
  readonly maxWidth: number;
}

// The dark card container shared by every screen: square #0C1219 panel with a
// 1px border, 32px padding, and a label chip notched into its top border.
export function Card({ children, label, maxWidth }: CardProps) {
  return (
    <div
      className="relative mx-auto w-full border border-border bg-card p-5 sm:p-8"
      style={{ maxWidth }}
    >
      <span className="absolute -top-2.5 left-3 bg-bg px-2 text-[13px] text-dim">{label}</span>
      {children}
    </div>
  );
}
