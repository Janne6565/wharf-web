import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Modal } from "@/components/Modal";
import type { UnlockedVault } from "@/crypto";
import { useKeyMismatchNoticeLogic } from "./useKeyMismatchNoticeLogic";

interface KeyMismatchNoticeProps {
  readonly vault: UnlockedVault;
  readonly localFingerprint: string;
  readonly serverFingerprint: string;
}

// The key-mismatch warning (ensureIdentity's "key-mismatch"): the public key the
// server publishes for this account is not the one in this vault, so project DEKs
// sealed "to us" may be readable by whoever holds the server's key. Deliberately
// non-dismissable — there is no benign reading of this state — and it shows both
// fingerprints so the user can compare them against another device.
export function KeyMismatchNotice({
  vault,
  localFingerprint,
  serverFingerprint,
}: KeyMismatchNoticeProps) {
  const { t } = useTranslation();
  const logic = useKeyMismatchNoticeLogic(vault);
  return (
    <div className="mt-1 flex flex-col gap-2" data-testid="key-mismatch-notice">
      <Alert tone="danger">
        <p className="flex items-center gap-2 font-bold">
          <TriangleAlert size={14} aria-hidden />
          {t("projects.identity.mismatch.title")}
        </p>
        <p className="mt-2">{t("projects.identity.mismatch.body")}</p>
        <Fingerprints local={localFingerprint} server={serverFingerprint} />
        <button
          type="button"
          onClick={logic.openConfirm}
          data-testid="key-mismatch-republish-open"
          className="mt-3 font-bold text-danger underline hover:text-accent"
        >
          {t("projects.identity.mismatch.republish.action")}
        </button>
      </Alert>
      {logic.republishError ? (
        <Alert tone="danger">{t("projects.identity.mismatch.republish.failed")}</Alert>
      ) : null}
      <RepublishConfirmModal logic={logic} />
    </div>
  );
}

function Fingerprints({ local, server }: { readonly local: string; readonly server: string }) {
  const { t } = useTranslation();
  return (
    <dl className="mt-3 flex flex-col gap-1 text-[12.5px]">
      <FingerprintRow label={t("projects.identity.mismatch.local")} value={local} testId="local" />
      <FingerprintRow
        label={t("projects.identity.mismatch.server")}
        value={server}
        testId="server"
      />
      <dd className="mt-2 text-muted">{t("projects.identity.mismatch.compare")}</dd>
    </dl>
  );
}

interface FingerprintRowProps {
  readonly label: string;
  readonly value: string;
  readonly testId: string;
}

function FingerprintRow({ label, value, testId }: FingerprintRowProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt className="w-44 text-muted">{label}</dt>
      <dd className="font-bold tracking-wide" data-testid={`key-fingerprint-${testId}`}>
        {value}
      </dd>
    </div>
  );
}

function RepublishConfirmModal({
  logic,
}: {
  readonly logic: ReturnType<typeof useKeyMismatchNoticeLogic>;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      open={logic.confirmOpen}
      onClose={logic.closeConfirm}
      tone="danger"
      label={t("projects.identity.mismatch.republish.title")}
      data-testid="key-mismatch-republish-modal"
    >
      <p className="mt-2 mb-4 text-[13px] leading-relaxed text-muted">
        {t("projects.identity.mismatch.republish.body")}
      </p>
      <div className="mb-5">
        <Checkbox
          checked={logic.acknowledged}
          onCheckedChange={logic.setAcknowledged}
          label={t("projects.identity.mismatch.republish.acknowledge")}
          data-testid="key-mismatch-acknowledge"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          loading={logic.republishing}
          disabled={!logic.canConfirm}
          onClick={logic.confirmRepublish}
          data-testid="key-mismatch-republish-confirm"
          className="w-auto px-4"
        >
          {t("projects.identity.mismatch.republish.confirm")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={logic.closeConfirm}
          data-testid="key-mismatch-republish-cancel"
          className="w-auto px-4"
        >
          {t("projects.identity.mismatch.republish.cancel")}
        </Button>
      </div>
    </Modal>
  );
}
