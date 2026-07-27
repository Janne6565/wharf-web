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
    <AppShell nav="connections" width={SHELL_WIDTH}>
      <div
        className="mx-auto flex w-full flex-col gap-6 md:flex-row md:gap-0"
        style={{ maxWidth: SHELL_WIDTH }}
      >
        {/* On mobile the sidebar becomes a row of tabs above the panel rather
            than a drawer: there are two items, and a drawer to hold two items
            is a control the user has to learn for no gain. */}
        <nav
          aria-label={t("account.navLabel")}
          className="flex shrink-0 gap-2 border-border md:w-[220px] md:flex-col md:gap-1 md:border-r md:pr-4"
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
        <div className="flex min-w-0 flex-1 flex-col gap-[26px] md:pl-8">{children}</div>
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
