import { Trans, useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";
import type { OwnedProjectImpact } from "./useDeleteAccountLogic";
import { useDeleteAccountLogic } from "./useDeleteAccountLogic";

type DeleteAccountLogic = ReturnType<typeof useDeleteAccountLogic>;

interface DeleteAccountModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

// The account-deletion confirmation: what is destroyed, why it is unrecoverable,
// and the two friction gates (typed email, master password) before the delete.
export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const logic = useDeleteAccountLogic(open);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={t("deleteAccount.action")}
      maxWidth={520}
      data-testid="delete-account-modal"
    >
      <h2 className="mt-2 mb-3 text-[18px] font-bold text-text">{t("deleteAccount.title")}</h2>
      <Preview logic={logic} />
      <Alert tone="danger" className="mt-4">
        <Trans
          i18nKey="deleteAccount.vaultWarning"
          components={{ 1: <span className="font-bold" /> }}
        />
      </Alert>
      <ConfirmForm logic={logic} onClose={onClose} />
    </Modal>
  );
}

// What deleting the account destroys, read from the server-side preview. The
// wording scales down for an empty account instead of over-warning.
function Preview({ logic }: { readonly logic: DeleteAccountLogic }) {
  const { t } = useTranslation();
  if (logic.previewLoading) {
    return <p className="text-[13px] text-dim">{t("deleteAccount.previewLoading")}</p>;
  }
  if (logic.previewFailed || !logic.preview) {
    return <p className="text-[13px] text-danger">{t("deleteAccount.previewFailed")}</p>;
  }
  const { ownedProjects, otherMemberships } = logic.preview;
  return (
    <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
      {ownedProjects.length === 0 ? (
        <p data-testid="delete-account-no-projects">{t("deleteAccount.noProjects")}</p>
      ) : (
        <OwnedProjects projects={ownedProjects} othersAffected={logic.othersAffected} />
      )}
      {otherMemberships > 0 ? (
        <p>{t("deleteAccount.otherMemberships", { count: otherMemberships })}</p>
      ) : null}
    </div>
  );
}

interface OwnedProjectsProps {
  readonly projects: readonly OwnedProjectImpact[];
  readonly othersAffected: number;
}

function OwnedProjects({ projects, othersAffected }: OwnedProjectsProps) {
  const { t } = useTranslation();
  return (
    <div data-testid="delete-account-owned">
      <p className="text-text">{t("deleteAccount.ownedHeading")}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {projects.map((project) => (
          <li key={project.id} className="border border-border bg-input px-3 py-2">
            <span className="text-text">{project.name}</span>
            <span className="ml-2 text-[12px] text-dim">
              {project.otherMemberCount > 0
                ? t("deleteAccount.projectMembers", { count: project.otherMemberCount })
                : t("deleteAccount.projectMembersNone")}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2">
        {othersAffected > 0
          ? t("deleteAccount.othersAffected", { count: othersAffected })
          : t("deleteAccount.othersAffectedNone")}
      </p>
    </div>
  );
}

interface ConfirmFormProps {
  readonly logic: DeleteAccountLogic;
  readonly onClose: () => void;
}

function ConfirmForm({ logic, onClose }: ConfirmFormProps) {
  const { t } = useTranslation();
  const { register, formState } = logic.form;
  return (
    <form onSubmit={logic.onSubmit} noValidate className="mt-5">
      <p className="mb-3 text-[13px] leading-relaxed text-muted">
        <Trans
          i18nKey="deleteAccount.emailPrompt"
          values={{ email: logic.email }}
          components={{ 1: <span className="text-text" /> }}
        />
      </p>
      <FormField
        label={t("fields.email")}
        autoComplete="off"
        data-testid="delete-account-email"
        error={formState.errors.email?.message}
        {...register("email")}
      />
      {logic.hasPassword ? (
        <div className="mt-4">
          <p className="mb-3 text-[13px] leading-relaxed text-muted">
            {t("deleteAccount.passwordPrompt")}
          </p>
          <FormField
            label={t("fields.masterPassword")}
            type="password"
            autoComplete="current-password"
            data-testid="delete-account-password"
            {...register("password")}
          />
        </div>
      ) : null}
      {logic.submitError ? (
        <p className="mt-4 text-[13px] text-danger">{logic.submitError}</p>
      ) : null}
      <div className="mt-6 flex gap-2">
        <Button
          type="submit"
          loading={logic.isDeleting}
          disabled={!logic.canSubmit}
          data-testid="delete-account-confirm"
        >
          {t("deleteAccount.confirm")}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="w-auto px-4">
          {t("deleteAccount.cancel")}
        </Button>
      </div>
    </form>
  );
}
