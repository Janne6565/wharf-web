import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { useDeviceLogic } from "./useDeviceLogic";

// The landing page (with an #install section) is owned by a follow-up task; for
// now the "install wharf" link just points at that anchor.
const INSTALL_HREF = "/#install";

export function DevicePage() {
  const { t } = useTranslation();
  const { email, formattedCode, timeLabel, hasCode, isIssuing, isError, isExpired } =
    useDeviceLogic();

  return (
    <AuthShell step={3}>
      <Card label={t("cards.device")} maxWidth={480}>
        <div className="text-center">
          <h2 className="mb-2 text-[20px] font-bold text-text">{t("device.title")}</h2>
          <p className="text-[13px] leading-relaxed text-muted">
            <Trans
              i18nKey="device.subtitle"
              values={{ email: email ?? "" }}
              components={{ 1: <span className="text-text" /> }}
            />
          </p>

          <div
            data-testid="device-code"
            className="mx-auto mt-6 border border-accent bg-input p-4 text-[26px] font-bold tracking-[0.2em] text-accent sm:p-5 sm:text-[34px] sm:tracking-[0.25em]"
          >
            {formattedCode ?? "····-····"}
          </div>

          <div className="mt-3 text-[12.5px] text-dim" data-testid="device-status">
            {isError
              ? t("device.error")
              : !hasCode || isIssuing
                ? t("device.issuing")
                : isExpired
                  ? t("device.reissuing")
                  : t("device.expiresIn", { time: timeLabel })}
          </div>

          <div className="mt-6 border border-border bg-input px-[18px] py-3.5 text-left text-[13px] leading-[1.7]">
            <div className="text-dim">{t("device.promptCommand")}</div>
            <div className="text-muted">
              {t("device.promptPaste")}
              <span className="ml-0.5 inline-block h-[1.1em] w-[0.55em] animate-blink bg-accent align-text-bottom" />
            </div>
          </div>

          <div className="mt-5 text-[12.5px] text-dim">
            {t("device.noTerminal")}{" "}
            <a className="text-accent hover:text-accent-strong" href={INSTALL_HREF}>
              {t("device.installWharf")}
            </a>
          </div>

          <div className="mt-5 text-[12.5px] text-dim">
            <Link to="/connections" className="text-accent hover:text-accent-strong">
              {t("device.viewConnections")}
            </Link>
          </div>
        </div>
      </Card>
    </AuthShell>
  );
}
