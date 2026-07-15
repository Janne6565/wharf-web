import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { useDeviceLogic } from "./useDeviceLogic";

export function DevicePage() {
  const { t } = useTranslation();
  const {
    email,
    onboarding,
    formattedCode,
    timeLabel,
    hasCode,
    isIssuing,
    isError,
    isExpired,
    installOpen,
    installCopied,
    installCommand,
    openInstall,
    closeInstall,
    copyInstall,
  } = useDeviceLogic();

  return (
    <>
      {/* During onboarding this is the final "[3] connect device" step; a
          returning user pairing a device instead gets a back link to their
          connections. */}
      <AuthShell step={onboarding ? 3 : undefined} backTo={onboarding ? undefined : "/connections"}>
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
              <div className="text-muted">{t("device.promptPaste")}</div>
            </div>

            <div className="mt-5 text-[12.5px] text-dim">
              {t("device.noTerminal")}{" "}
              <button
                type="button"
                onClick={openInstall}
                data-testid="device-install-open"
                className="text-accent hover:text-accent-strong"
              >
                {t("device.installWharf")}
              </button>
            </div>

            {/* In onboarding there is no back link, so offer a way on to the
                (freshly created) connections; the hub context uses the back link. */}
            {onboarding ? (
              <div className="mt-5 text-[12.5px] text-dim">
                <Link to="/connections" className="text-accent hover:text-accent-strong">
                  {t("device.viewConnections")}
                </Link>
              </div>
            ) : null}
          </div>
        </Card>
      </AuthShell>

      <InstallModal
        open={installOpen}
        onClose={closeInstall}
        command={installCommand}
        copied={installCopied}
        onCopy={() => void copyInstall()}
      />
    </>
  );
}

interface InstallModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly command: string;
  readonly copied: boolean;
  readonly onCopy: () => void;
}

function InstallModal({ open, onClose, command, copied, onCopy }: InstallModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={t("cards.install")}
      maxWidth={560}
      data-testid="device-install-modal"
    >
      <h2 className="mb-1.5 text-[18px] font-bold text-text">{t("device.installTitle")}</h2>
      <p className="mb-5 text-[13px] leading-relaxed text-muted">{t("device.installBody")}</p>
      <div className="flex items-center gap-x-3 border border-border bg-code px-[18px] py-3 font-mono text-[13px]">
        <span className="text-dim">$</span>
        <span className="flex-1 overflow-x-auto whitespace-nowrap text-text">{command}</span>
        <button
          type="button"
          onClick={onCopy}
          data-testid="device-install-copy"
          className="min-w-[72px] flex-none border border-border px-2 py-0.5 text-center text-xs text-accent hover:text-accent-strong"
        >
          [ {copied ? t("common.copied") : t("common.copy")} ]
        </button>
      </div>
    </Modal>
  );
}
