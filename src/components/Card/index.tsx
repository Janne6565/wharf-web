import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface CardProps {
  readonly children: ReactNode;
  // The floating label chip that sits on the card's top border (e.g. "sign up",
  // "recover vault"). One per screen, per the v2 design.
  readonly label: string;
  // Exact width in px per the design (signup 460, recovery-code 540, device 480,
  // signin 440, recover 500). Passed as an inline max-width because it is an
  // exact, per-screen value rather than a shared design token.
  readonly maxWidth: number;
  // When set, notches a "← back" link chip into the top-right border,
  // mirroring the label chip on the left.
  readonly backTo?: string;
}

// The dark card container shared by every screen: square #0C1219 panel with a
// 1px border, 32px padding, and a label chip notched into its top border.
export function Card({ children, label, maxWidth, backTo }: CardProps) {
  const { t } = useTranslation();
  return (
    <div
      className="relative mx-auto w-full border border-border bg-card p-5 sm:p-8"
      style={{ maxWidth }}
    >
      <span className="absolute -top-2.5 left-3 bg-bg px-2 text-[13px] text-dim">{label}</span>
      {backTo ? (
        <Link
          to={backTo}
          data-testid="auth-back"
          className="absolute -top-2.5 right-3 bg-bg px-2 text-[13px] text-dim hover:text-accent"
        >
          {t("common.back")}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
