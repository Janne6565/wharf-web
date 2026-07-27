import { CircleAlert, FolderClosed, Info, Mail, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AccountShell } from "@/components/AccountShell";
import { Switch } from "@/components/Switch";
import { cn } from "@/lib/utils";
import { COLLABORATION_KEYS, SECURITY_NOTICES } from "./catalogue";
import { LockedRow, SettingRow } from "./SettingRow";
import { useNotificationsLogic } from "./useNotificationsLogic";

// Notification settings. Two sections, security first and locked, because the
// order is the argument: the mail you cannot turn off is listed before the mail
// you can, so the page explains itself before it offers any switches.
export function NotificationsPage() {
  const { t } = useTranslation();
  const {
    preferences,
    loadFailed,
    reload,
    status,
    enabledCount,
    total,
    allOn,
    allOff,
    masterSaving,
    toggle,
    toggleAll,
    retry,
    hasProjects,
  } = useNotificationsLogic();

  return (
    <AccountShell active="notifications">
      <div className="flex flex-col gap-[6px]">
        <h2 className="text-[19px] font-bold text-text">{t("notifications.title")}</h2>
        <p className="text-[13px] leading-relaxed text-muted">{t("notifications.subtitle")}</p>
      </div>

      {loadFailed ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 border border-danger-border bg-danger-bg px-4 py-3 text-[12.5px] text-danger"
        >
          <span className="flex items-center gap-2">
            <CircleAlert size={15} aria-hidden />
            {t("notifications.loadFailed")}
          </span>
          <button type="button" onClick={reload} className="text-[11.5px] hover:text-text">
            {"[ "}
            {t("notifications.retry")}
            {" ]"}
          </button>
        </div>
      ) : null}

      <Section label={t("notifications.securityLabel")}>
        <div className="flex flex-col gap-2 px-6 pt-6 pb-[18px]">
          <div className="flex items-center gap-[10px] text-[14px] font-bold text-text">
            <ShieldCheck size={16} aria-hidden className="text-warn" />
            {t("notifications.alwaysOn")}
          </div>
          <p className="max-w-[620px] text-[12.5px] leading-relaxed text-muted text-pretty">
            {t("notifications.securityExplainer")}
          </p>
        </div>
        <div className="flex flex-col">
          {SECURITY_NOTICES.map((notice) => (
            <LockedRow
              key={notice}
              title={t(`notifications.items.${notice}.title`)}
              description={t(`notifications.items.${notice}.description`)}
            />
          ))}
        </div>
      </Section>

      <Section label={t("notifications.collaborationLabel")}>
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 px-6 py-[22px] sm:grid-cols-[1fr_130px]">
          <div className="flex min-w-0 flex-col gap-1">
            <div
              className={cn(
                "flex items-center gap-[10px] text-[14px] font-bold",
                allOff ? "text-muted" : "text-text",
              )}
            >
              <Mail size={16} aria-hidden className={allOff ? "text-dim" : "text-accent"} />
              {t("notifications.allCollaboration")}
            </div>
            <p
              className={cn(
                "text-[12.5px] leading-relaxed",
                allOff ? "text-row-hint" : "text-muted",
              )}
            >
              {allOff
                ? t("notifications.groupOff")
                : allOn
                  ? t("notifications.groupHint")
                  : t("notifications.groupPartial")}
            </p>
          </div>
          <div className="flex items-center justify-end gap-[10px]">
            <span
              data-testid="notifications-count"
              className={cn(
                "text-[11.5px]",
                allOn ? "text-accent" : allOff ? "text-row-hint" : "text-muted",
              )}
            >
              {t("notifications.enabledCount", {
                enabled: String(enabledCount),
                total: String(total),
              })}
            </span>
            <Switch
              state={masterSaving ? "saving" : allOn ? "on" : allOff ? "off" : "mixed"}
              onToggle={toggleAll}
              label={t("notifications.allCollaboration")}
              data-testid="notifications-master-switch"
            />
          </div>
        </div>

        {status.all === "error" ? (
          <Note tone="danger" icon={<CircleAlert size={15} aria-hidden className="text-danger" />}>
            <span role="alert">{t("notifications.groupSaveFailed")}</span>{" "}
            <button
              type="button"
              onClick={() => retry("all")}
              className="border-b border-danger-border text-danger hover:text-text"
            >
              {"[ "}
              {t("notifications.retry")}
              {" ]"}
            </button>
          </Note>
        ) : null}

        {/* Two mutually exclusive notes, and neither is a warning: turning
            collaboration mail off is a legitimate choice, and having no projects
            yet is the normal state of a new account. */}
        {allOff ? (
          <Note icon={<Info size={15} aria-hidden className="text-muted" />}>
            {t("notifications.allOffNote")}
          </Note>
        ) : hasProjects === false ? (
          <Note icon={<FolderClosed size={15} aria-hidden className="text-muted" />}>
            {t("notifications.noProjectsNote")}
          </Note>
        ) : null}

        <div className="flex flex-col">
          {COLLABORATION_KEYS.map((key) => (
            <SettingRow
              key={key}
              testId={`notifications-row-${key}`}
              title={t(`notifications.items.${key}.title`)}
              description={t(`notifications.items.${key}.description`)}
              enabled={preferences[key]}
              // A master write is writing every row, so every row is pending.
              status={masterSaving ? "saving" : (status[key] ?? "idle")}
              onToggle={() => toggle(key)}
              onRetry={() => retry(key)}
            />
          ))}
        </div>
      </Section>

      <p className="text-[12px] leading-relaxed text-dim">{t("notifications.sentTo")}</p>
    </AccountShell>
  );
}

// A bordered panel with its name notched into the top edge — the same framing
// the rest of wharf uses for a group of controls.
function Section({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <section className="relative border border-border bg-card">
      <span className="absolute -top-[10px] left-[14px] bg-bg px-2 text-[12.5px] text-dim">
        {label}
      </span>
      {children}
    </section>
  );
}

function Note({
  icon,
  tone = "neutral",
  children,
}: {
  readonly icon: ReactNode;
  readonly tone?: "neutral" | "danger";
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-6 mb-1 flex items-start gap-[10px] border px-4 py-[13px] text-[12.5px] leading-relaxed text-muted text-pretty",
        tone === "danger"
          ? "border-danger-border border-l-2 border-l-danger bg-danger-bg"
          : "border-border border-l-2 border-l-dim bg-bg",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}
