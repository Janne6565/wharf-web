import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { useRecoveryCodeLogic } from "./useRecoveryCodeLogic";

const emphasis = {
  1: <strong className="font-semibold text-warn" />,
  3: <strong className="font-semibold text-warn" />,
};

export function RecoveryCodePage() {
  const { t } = useTranslation();
  const {
    groups,
    stored,
    setStored,
    copied,
    handleCopy,
    handleDownload,
    handlePrint,
    handleContinue,
  } = useRecoveryCodeLogic();

  return (
    <AuthShell step={2}>
      <Card maxWidth={520}>
        <h2 className="mb-1 text-[22px] text-text">{t("recovery.title")}</h2>
        <p className="mb-5.5 text-[14.5px] leading-relaxed text-muted">
          <Trans i18nKey="recovery.intro" components={emphasis} />
        </p>

        <div
          data-testid="recovery-code"
          className="grid grid-cols-4 gap-x-3.5 gap-y-2.5 rounded-xl border border-dashed border-warn-border bg-input p-5 text-center font-mono text-[15.5px] tracking-wider text-accent"
        >
          {groups.map((group, index) => (
            // Fixed-length, never-reordered sequence; groups can repeat, so the
            // position is the only stable identity.
            // biome-ignore lint/suspicious/noArrayIndexKey: positional groups
            <span key={index}>{group}</span>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCopy}
            data-testid="recovery-copy"
          >
            {copied ? t("recovery.copied") : t("recovery.copy")}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={handleDownload}>
            {t("recovery.download")}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={handlePrint}>
            {t("recovery.print")}
          </Button>
        </div>

        <div className="mt-5.5">
          <Checkbox
            checked={stored}
            onCheckedChange={setStored}
            label={t("recovery.stored")}
            data-testid="recovery-stored"
          />
        </div>

        <Button
          className="mt-5.5"
          disabled={!stored}
          onClick={handleContinue}
          data-testid="recovery-continue"
        >
          {t("recovery.continue")}
        </Button>
        <p className="mt-3 text-center text-[12.5px] text-dim">{t("recovery.footnote")}</p>
      </Card>
    </AuthShell>
  );
}
