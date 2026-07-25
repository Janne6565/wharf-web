import { BadgeAlert, BadgeCheck, LogOut, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { DangerZone } from "./DangerZone";
import { useAccountLogic } from "./useAccountLogic";

const CARD_WIDTH = 640;

// The account screen: who you are signed in as, how to sign out, and the
// irreversible way out.
export function AccountPage() {
  const { t } = useTranslation();
  const { email, emailVerified, signOut, isSigningOut } = useAccountLogic();

  return (
    <AppShell nav="connections" width={CARD_WIDTH}>
      <Card label={t("cards.account")} maxWidth={CARD_WIDTH}>
        <h2 className="mb-[22px] text-[19px] font-bold text-text">{t("account.title")}</h2>
        <EmailRow email={email} verified={emailVerified} />
        <SignOutRow onSignOut={signOut} loading={isSigningOut} />
        <DangerZone />
      </Card>
    </AppShell>
  );
}

interface EmailRowProps {
  readonly email: string | null;
  // Undefined while the profile is still loading.
  readonly verified: boolean | undefined;
}

function EmailRow({ email, verified }: EmailRowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[14px] border border-border bg-input px-[18px] py-4">
      <Mail size={18} aria-hidden className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] tracking-[0.08em] text-dim uppercase">
          {t("account.emailLabel")}
        </div>
        <div className="mt-1 break-all text-[14px] text-text" data-testid="account-email">
          {email}
        </div>
      </div>
      {verified === undefined ? null : (
        <span
          data-testid="account-email-verified"
          className={cn(
            "flex shrink-0 items-center gap-[7px] text-[12.5px]",
            verified ? "text-success" : "text-warn",
          )}
        >
          {verified ? <BadgeCheck size={15} aria-hidden /> : <BadgeAlert size={15} aria-hidden />}
          {verified ? t("account.verified") : t("account.unverified")}
        </span>
      )}
    </div>
  );
}

interface SignOutRowProps {
  readonly onSignOut: () => void;
  readonly loading: boolean;
}

function SignOutRow({ onSignOut, loading }: SignOutRowProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border border-border bg-input px-[18px] py-4">
      <p className="text-[12.5px] leading-relaxed text-muted">{t("account.signOutHint")}</p>
      <button
        type="button"
        onClick={onSignOut}
        disabled={loading}
        data-testid="account-sign-out"
        className="flex shrink-0 items-center gap-2 border border-border px-[13px] py-2 text-[12.5px] text-subtle hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:text-dim"
      >
        {loading ? <Spinner /> : <LogOut size={15} aria-hidden className="text-muted" />}
        {"[ "}
        {t("account.signOut")}
        {" ]"}
      </button>
    </div>
  );
}
