import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { useDeviceLogic } from "./useDeviceLogic";

const INSTALL_HREF = "https://github.com/Janne6565/wharf-tui";

export function DevicePage() {
  const { t } = useTranslation();
  const { email, formattedCode, timeLabel, hasCode, isIssuing, isError, isExpired } =
    useDeviceLogic();

  return (
    <AuthShell step={3}>
      <Card maxWidth={460}>
        <div className="text-center">
          <h2 className="mb-1.5 text-[22px] text-text">{t("device.title")}</h2>
          <p className="text-[14.5px] leading-relaxed text-muted">
            <Trans
              i18nKey="device.subtitle"
              values={{ email: email ?? "" }}
              components={{ 1: <span className="text-text" /> }}
            />
          </p>

          <div
            data-testid="device-code"
            className="mx-auto mt-6 rounded-xl border border-accent bg-input p-[18px] font-mono text-[34px] font-bold tracking-[0.25em] text-accent"
          >
            {formattedCode ?? "····-····"}
          </div>

          <div className="mt-3 font-mono text-[13px] text-dim" data-testid="device-status">
            {isError
              ? t("device.error")
              : !hasCode || isIssuing
                ? t("device.issuing")
                : isExpired
                  ? t("device.reissuing")
                  : t("device.expiresIn", { time: timeLabel })}
          </div>

          <div className="mt-6 rounded-input border border-border bg-input px-[18px] py-3.5 text-left font-mono text-[13px] leading-[1.7]">
            <div className="text-dim">{t("device.promptCommand")}</div>
            <div className="text-muted">{t("device.promptPaste")}</div>
          </div>

          <div className="mt-[18px] text-[13px] text-dim">
            {t("device.noTerminal")}{" "}
            <a
              className="text-accent hover:text-accent-strong"
              href={INSTALL_HREF}
              target="_blank"
              rel="noreferrer"
            >
              {t("device.installWharf")}
            </a>
          </div>
        </div>
      </Card>
    </AuthShell>
  );
}
