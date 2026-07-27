import { Check, CircleAlert, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/Spinner";
import { Switch } from "@/components/Switch";
import { cn } from "@/lib/utils";
import type { RowStatus } from "./useNotificationsLogic";

interface LockedRowProps {
  readonly title: string;
  readonly description: string;
}

// A security notice. Rendered as a statement of fact with a lock, never as a
// disabled switch: a greyed-out toggle reads as a bug or as something that
// might become available, and neither is true here.
export function LockedRow({ title, description }: LockedRowProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-t border-row-divider px-6 py-[15px] sm:grid-cols-[1fr_130px]">
      <div className="flex min-w-0 flex-col gap-[3px]">
        <div className="text-[13.5px] text-text">{title}</div>
        <div className="text-[12px] leading-normal text-row-hint">{description}</div>
      </div>
      <div className="flex items-center justify-end gap-2 text-[11.5px] text-dim">
        <Lock size={14} aria-hidden className="shrink-0" />
        {t("notifications.lockedOn")}
      </div>
    </div>
  );
}

interface SettingRowProps {
  readonly title: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly status: RowStatus;
  readonly onToggle: () => void;
  readonly onRetry: () => void;
  readonly testId: string;
}

// One optional notification. Owns its own write, so a failure here reverts this
// toggle and leaves the other six alone.
export function SettingRow({
  title,
  description,
  enabled,
  status,
  onToggle,
  onRetry,
  testId,
}: SettingRowProps) {
  const { t } = useTranslation();
  const failed = status === "error";
  const off = !enabled && !failed;

  return (
    <div
      data-testid={testId}
      data-status={status}
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-5 border-t border-row-divider px-6 py-[15px] sm:grid-cols-[1fr_190px]",
        // The failure is marked on the row itself rather than in a page-level
        // banner: the reader has to know *which* switch did not save.
        failed && "border-l-2 border-l-danger bg-danger-bg",
      )}
    >
      <div className="flex min-w-0 flex-col gap-[3px]">
        <div className={cn("text-[13.5px]", off ? "text-muted" : "text-text")}>{title}</div>
        {failed ? (
          <div className="flex items-start gap-2 text-[12px] leading-normal text-danger">
            <CircleAlert size={14} aria-hidden className="mt-px shrink-0" />
            <span role="alert">{t("notifications.saveFailed")}</span>
          </div>
        ) : (
          <div
            className={cn(
              "text-[12px] leading-normal",
              off ? "text-row-off-hint" : "text-row-hint",
            )}
          >
            {description}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-[10px]">
        <RowStatusLabel status={status} onRetry={onRetry} />
        <Switch
          state={status === "saving" ? "saving" : enabled ? "on" : "off"}
          onToggle={onToggle}
          label={title}
          data-testid={`${testId}-switch`}
        />
      </div>
    </div>
  );
}

function RowStatusLabel({
  status,
  onRetry,
}: {
  readonly status: RowStatus;
  readonly onRetry: () => void;
}) {
  const { t } = useTranslation();
  if (status === "saving") {
    return (
      <span className="flex items-center gap-[7px] text-[11.5px] text-accent">
        <Spinner />
        {t("notifications.saving")}
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-[7px] text-[11.5px] text-success">
        <Check size={13} strokeWidth={2.4} aria-hidden />
        {t("notifications.saved")}
      </span>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="border-b border-danger-border text-[11.5px] text-danger hover:text-text"
      >
        {"[ "}
        {t("notifications.retry")}
        {" ]"}
      </button>
    );
  }
  return null;
}
