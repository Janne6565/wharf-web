import { useTranslation } from "react-i18next";
import { Button, PAIRED_CANCEL_CLASS } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { useInviteModalLogic } from "./useInviteModalLogic";
import type { InviteErrorKind } from "./useProjectDetailLogic";

interface InviteModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onInvite: (email: string) => void;
  readonly saving: boolean;
  readonly error: InviteErrorKind;
  readonly done: boolean;
  readonly reset: () => void;
}

// The invite-member dialog. The canonical copy — "They get access to this
// project's hosts. Keys stay yours." — is the invite's promise: the invitee can
// use the shared hosts, but private keys never leave their owner.
export function InviteModal({
  open,
  onClose,
  onInvite,
  saving,
  error,
  done,
  reset,
}: InviteModalProps) {
  const { t } = useTranslation();
  const logic = useInviteModalLogic(done, onClose, reset);

  return (
    <Modal open={open} onClose={logic.close} label={t("cards.project")} data-testid="invite-modal">
      <h3 className="mb-2 text-[16px] font-bold text-text">{t("projectDetail.invite.title")}</h3>
      <p className="mb-5 text-[13px] leading-relaxed text-muted">
        {t("projectDetail.invite.copy")}
      </p>
      <form onSubmit={logic.form.handleSubmit((values) => onInvite(values.email))} noValidate>
        <FormField
          label={t("projectDetail.invite.email")}
          type="email"
          autoComplete="off"
          data-testid="invite-email"
          error={logic.form.formState.errors.email?.message}
          {...logic.form.register("email")}
        />
        {error ? (
          <p className="mt-3 text-[13px] text-danger">
            {error === "conflict"
              ? t("projectDetail.errors.inviteConflict")
              : t("projectDetail.errors.inviteFailed")}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button
            type="submit"
            loading={saving}
            disabled={!logic.canSubmit}
            data-testid="invite-submit"
          >
            {t("projectDetail.invite.submit")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={logic.close}
            className={PAIRED_CANCEL_CLASS}
          >
            {t("projectDetail.invite.cancel")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
