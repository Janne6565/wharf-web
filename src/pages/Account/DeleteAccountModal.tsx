import { Lock, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import { countsSentence, DeletionImpact } from "./DeletionImpact";
import { useDeleteAccountLogic } from "./useDeleteAccountLogic";

type DeleteAccountLogic = ReturnType<typeof useDeleteAccountLogic>;

const MODAL_WIDTH = 640;

interface DeleteAccountModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

// The account-deletion confirmation, in two presentations. When the account
// owns projects, has memberships or holds a vault we cannot prove is empty, it
// is the full red warning behind a typed-email gate. When there is genuinely
// nothing to lose it drops to a calm neutral confirmation — over-warning about
// an empty account only teaches people to click through warnings.
export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const logic = useDeleteAccountLogic(open);
  const calm = logic.nothingToLose;

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={t("deleteAccount.modalLabel")}
      maxWidth={MODAL_WIDTH}
      tone={calm ? "default" : "danger"}
      padded={false}
      data-testid="delete-account-modal"
    >
      {calm ? <CalmBody logic={logic} /> : <FullBody logic={logic} />}
      <ConfirmForm logic={logic} onClose={onClose} />
    </Modal>
  );
}

// Screen 06: an account with something to lose.
function FullBody({ logic }: { readonly logic: DeleteAccountLogic }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-start gap-[14px] px-[26px] pt-[26px]">
        <span className="flex size-[34px] shrink-0 items-center justify-center border border-danger-border bg-danger-bg text-danger">
          <TriangleAlert size={17} aria-hidden />
        </span>
        <div>
          <h2 className="text-[18px] font-bold text-text">
            {t("deleteAccount.title", { email: logic.email })}
          </h2>
          <p className="mt-[5px] text-[12.5px] leading-relaxed text-danger-muted">
            {t("deleteAccount.subtitle")}
          </p>
        </div>
      </div>
      <DeletionImpact logic={logic} />
    </>
  );
}

// Screen 07: nothing to lose. Neutral border, plain copy, and a summary row
// that shows the zeros the decision rests on.
function CalmBody({ logic }: { readonly logic: DeleteAccountLogic }) {
  const { t } = useTranslation();
  return (
    <div className="px-[26px] pt-7">
      <h2 className="text-[18px] font-bold text-text">
        {t("deleteAccount.title", { email: logic.email })}
      </h2>
      <p data-testid="delete-account-calm" className="mt-2 text-[12.5px] leading-[1.7] text-muted">
        {t("deleteAccount.calmBody")}
      </p>
      {logic.vaultContents ? (
        <div className="mt-5 flex items-center gap-3 border border-border bg-input px-4 py-[13px] text-[12.5px] text-dim">
          <Lock size={15} aria-hidden className="shrink-0" />
          <span data-testid="delete-account-vault-counts">
            {countsSentence(t, logic.vaultContents)}
            {" · "}
            {t("deleteAccount.vaultCounts.projects", { count: logic.ownedProjectCount })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

interface ConfirmFormProps {
  readonly logic: DeleteAccountLogic;
  readonly onClose: () => void;
}

// The friction gates: the typed email (full variant only) and the master
// password, which is re-derived into the authKey the backend verifies.
function ConfirmForm({ logic, onClose }: ConfirmFormProps) {
  const { t } = useTranslation();
  const { register, formState } = logic.form;
  return (
    <form onSubmit={logic.onSubmit} noValidate>
      <div className="mt-[22px] flex flex-col gap-5 px-[26px]">
        {logic.requiresEmailConfirmation ? (
          <FormField
            label={t("deleteAccount.emailLabel", { email: logic.email })}
            tone="danger"
            autoComplete="off"
            data-testid="delete-account-email"
            error={formState.errors.email?.message}
            className="h-11 text-[13.5px]"
            {...register("email")}
          />
        ) : null}
        {logic.hasPassword ? (
          <FormField
            label={t("fields.masterPassword")}
            type="password"
            autoComplete="current-password"
            placeholder={t("deleteAccount.passwordPrompt")}
            data-testid="delete-account-password"
            className="h-11 text-[13.5px]"
            {...register("password")}
          />
        ) : null}
        {logic.submitError ? <p className="text-[13px] text-danger">{logic.submitError}</p> : null}
      </div>
      <div className="flex gap-3 px-[26px] pt-6 pb-[26px]">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="h-[46px] flex-1 text-[13.5px]"
        >
          {t("deleteAccount.cancel")}
        </Button>
        <Button
          type="submit"
          // Solid red when there is something to lose, a red outline when there
          // is not — same action, proportionate weight.
          variant={logic.nothingToLose ? "danger-outline" : "danger"}
          loading={logic.isDeleting}
          disabled={!logic.canSubmit}
          data-testid="delete-account-confirm"
          // The icon sits outside the brackets, as the design draws it.
          bracket={false}
          className="h-[46px] flex-1 gap-[9px] text-[13.5px]"
        >
          {logic.nothingToLose ? null : <Trash2 size={15} aria-hidden />}
          {"[ "}
          {t("deleteAccount.confirm")}
          {" ]"}
        </Button>
      </div>
      {logic.nothingToLose ? (
        <p className="px-[26px] pb-[26px] text-center text-[12px] text-dim">
          {t("deleteAccount.calmFootnote")}
        </p>
      ) : null}
    </form>
  );
}
