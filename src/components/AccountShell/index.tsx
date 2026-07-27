import { Link } from "@tanstack/react-router";
import { Bell, CircleUser } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";

const SHELL_WIDTH = 940;

export type AccountSection = "overview" | "notifications";

interface AccountShellProps {
  readonly active: AccountSection;
  readonly children: ReactNode;
}

// The frame shared by the account routes: a nav column on the left, the active
// panel on the right.
//
// The nav lists only what exists. The design sketches five routes — sign-in
// methods, master password and recovery code alongside these two — but those
// panels have not been built, and a nav item leading to an empty page is worse
// than one that is not there yet. They slot in beside `notifications` when they
// land; nothing here has to change to make room for them.
export function AccountShell({ active, children }: AccountShellProps) {
  const { t } = useTranslation();
  return (
    <AppShell nav="connections" width={SHELL_WIDTH} align="top">
      <div
        className="mx-auto flex w-full flex-col gap-6 md:flex-row md:items-start md:gap-0"
        style={{ maxWidth: SHELL_WIDTH }}
      >
        {/* On mobile the sidebar becomes a row of tabs above the panel rather
            than a drawer: there are two items, and a drawer to hold two items
            is a control the user has to learn for no gain.

            md:self-start (via the row's items-start) is what keeps the nav from
            stretching to the height of whatever is beside it. A flex item
            stretches by default, so without it the nav — and the divider it used
            to draw — was as tall as the panel, and every page with different
            content resized the navigation itself. It now measures its own two
            items and nothing else; sticky keeps it in view on the long pages. */}
        <nav
          aria-label={t("account.navLabel")}
          className="flex shrink-0 gap-2 md:sticky md:top-10 md:w-[220px] md:flex-col md:gap-1 md:self-start md:pr-4"
        >
          <NavItem
            to="/account"
            icon={<CircleUser size={15} aria-hidden />}
            label={t("account.navOverview")}
            active={active === "overview"}
            testId="account-nav-overview"
          />
          <NavItem
            to="/account/notifications"
            icon={<Bell size={15} aria-hidden />}
            label={t("account.navNotifications")}
            active={active === "notifications"}
            testId="account-nav-notifications"
          />
        </nav>
        {/* The divider belongs to the panel, not to the nav. Drawn here it spans
            the content it separates — the full-height rule the design shows —
            while leaving the nav's own height independent of it. */}
        <div className="flex min-w-0 flex-1 flex-col gap-[26px] border-border md:border-l md:pl-8">
          {children}
        </div>
      </div>
    </AppShell>
  );
}

interface NavItemProps {
  readonly to: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly active: boolean;
  readonly testId: string;
}

function NavItem({ to, icon, label, active, testId }: NavItemProps) {
  return (
    <Link
      to={to}
      data-testid={testId}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-[10px] px-[10px] py-[9px] text-[13px]",
        active
          ? "bg-accent font-bold text-accent-ink"
          : "text-subtle hover:border-accent hover:text-text",
      )}
    >
      <span className={active ? "text-accent-ink" : "text-dim"}>{icon}</span>
      {label}
    </Link>
  );
}
