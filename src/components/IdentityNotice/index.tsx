import { useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import type { UnlockedVault } from "@/crypto";
import { useIdentityNoticeLogic } from "./useIdentityNoticeLogic";

interface IdentityNoticeProps {
  readonly vault: UnlockedVault;
}

// The needs-sync notice shown on the projects hub and the project-detail screen:
// this vault carries no project identity but the server already holds a public
// key (ensureIdentity's "needs-sync"). It tells the user to sync the device that
// created the identity, and offers the "I lost my old vault" recovery — a
// public-key rotation (see useIdentityNoticeLogic + vault/identity resetIdentity).
export function IdentityNotice({ vault }: IdentityNoticeProps) {
  const { t } = useTranslation();
  const logic = useIdentityNoticeLogic(vault);
  return (
    <div className="mt-1 flex flex-col gap-2" data-testid="identity-notice">
      <Alert tone="warning">
        <p>{t("projects.identity.needsSync")}</p>
        <button
          type="button"
          onClick={logic.openConfirm}
          data-testid="identity-reset-open"
          className="mt-2 font-bold text-warn underline hover:text-accent"
        >
          {t("projects.identity.reset.action")}
        </button>
      </Alert>
      {logic.resetError ? <Alert tone="danger">{t("projects.identity.reset.failed")}</Alert> : null}
      <ResetConfirmModal logic={logic} />
    </div>
  );
}

function ResetConfirmModal({
  logic,
}: {
  readonly logic: ReturnType<typeof useIdentityNoticeLogic>;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      open={logic.confirmOpen}
      onClose={logic.closeConfirm}
      label={t("projects.identity.reset.title")}
      data-testid="identity-reset-modal"
    >
      <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted">
        {t("projects.identity.reset.body")}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          loading={logic.resetting}
          onClick={logic.confirmReset}
          data-testid="identity-reset-confirm"
          className="w-auto px-4"
        >
          {t("projects.identity.reset.confirm")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={logic.closeConfirm}
          data-testid="identity-reset-cancel"
          className="w-auto px-4"
        >
          {t("projects.identity.reset.cancel")}
        </Button>
      </div>
    </Modal>
  );
}
