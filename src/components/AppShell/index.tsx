import { Link } from "@tanstack/react-router";
import { ChevronLeft, CircleUser } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LogoChip } from "@/components/LogoChip";
import { useAppShellLogic } from "./useAppShellLogic";

// Which page the shell frames, which decides the header's right-hand control.
type ShellNav = "account" | "connections";

interface AppShellProps {
  readonly children: ReactNode;
  // Where the header's right-hand link points: "account" renders the account
  // link (shown on connections), "connections" the back link (on /account).
  readonly nav: ShellNav;
  // Width of the header row in px. Matches the card below it so the brand chip
  // and the nav link line up with the card's edges.
  readonly width: number;
}

// The page frame for signed-in screens. Unlike <AuthShell> — which pins an
// absolute back link and an onboarding step indicator, both right for the
// sign-up funnel and wrong here — this renders a real header row above the
// card: the brand chip on the left, one navigation control on the right.
export function AppShell({ children, nav, width }: AppShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[34px] bg-bg px-4 py-10 font-mono">
      <header
        className="mx-auto flex w-full items-center justify-between gap-3"
        style={{ maxWidth: width }}
      >
        <LogoChip />
        {nav === "account" ? <AccountLink /> : <BackToConnectionsLink />}
      </header>
      <div className="w-full">{children}</div>
    </main>
  );
}

function AccountLink() {
  const { t } = useTranslation();
  const { email } = useAppShellLogic();
  return (
    <Link
      to="/account"
      data-testid="shell-account"
      className="flex items-center gap-2 text-[12.5px] text-accent hover:text-accent-strong"
    >
      <CircleUser size={15} aria-hidden className="text-dim" />
      {email ?? t("nav.account")}
    </Link>
  );
}

function BackToConnectionsLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/connections"
      data-testid="shell-back"
      className="flex items-center gap-2 text-[12.5px] text-accent hover:text-accent-strong"
    >
      <ChevronLeft size={15} aria-hidden />
      {t("nav.backToConnections")}
    </Link>
  );
}
