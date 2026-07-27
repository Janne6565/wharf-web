import { Link } from "@tanstack/react-router";
import { ChevronLeft, CircleUser, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LogoChip } from "@/components/LogoChip";
import { useAppShellLogic } from "./useAppShellLogic";

// Which page the shell frames, which decides the header's right-hand control.
type ShellNav = "account" | "connections";

interface AppShellProps {
  readonly children: ReactNode;
  // Where the header's trailing link points: "account" renders the account
  // link (shown on connections), "connections" the back link (on /account).
  readonly nav: ShellNav;
  // Width of the header row in px. Matches the card below it so the brand chip
  // and the nav link line up with the card's edges.
  readonly width: number;
}

// The page frame for signed-in screens. Unlike <AuthShell> — which pins an
// absolute back link and an onboarding step indicator, both right for the
// sign-up funnel and wrong here — this renders a real header row above the
// card: the brand chip on the left, the nav controls on the right.
export function AppShell({ children, nav, width }: AppShellProps) {
  const { email, inviteCount } = useAppShellLogic();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[34px] bg-bg px-4 py-10 font-mono">
      <header
        className="mx-auto flex w-full items-center justify-between gap-3"
        style={{ maxWidth: width }}
      >
        <LogoChip />
        <nav className="flex items-center gap-4">
          <ProjectsLink inviteCount={inviteCount} />
          {nav === "account" ? <AccountLink email={email} /> : <BackToConnectionsLink />}
        </nav>
      </header>
      <div className="w-full">{children}</div>
    </main>
  );
}

// Projects live behind their own route with no other entry point, so this link
// is the only way into a pending invite. The badge carries that: it is the
// signal that something is waiting, not decoration, so it renders only when the
// count is non-zero.
function ProjectsLink({ inviteCount }: { readonly inviteCount: number }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/projects"
      data-testid="shell-projects"
      className="flex items-center gap-2 text-[12.5px] text-accent hover:text-accent-strong"
    >
      <Users size={15} aria-hidden className="text-dim" />
      {t("nav.projects")}
      {inviteCount > 0 ? (
        <span
          data-testid="shell-invite-badge"
          title={t("nav.pendingInvites", { count: inviteCount })}
          className="border border-warn-border bg-warn-bg px-[5px] py-px text-[11px] text-warn"
        >
          {String(inviteCount)}
        </span>
      ) : null}
    </Link>
  );
}

function AccountLink({ email }: { readonly email: string | null }) {
  const { t } = useTranslation();
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
