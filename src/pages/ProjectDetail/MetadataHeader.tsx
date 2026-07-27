import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, PAIRED_CANCEL_CLASS } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useMetadataHeaderLogic } from "./useMetadataHeaderLogic";

interface MetadataHeaderProps {
  readonly name: string;
  readonly description: string;
  readonly hostCount: number;
  readonly canEdit: boolean;
  readonly saving: boolean;
  readonly error: boolean;
  readonly onSave: (name: string, description: string) => void;
}

// The project title block: name, description and host count, with an inline
// name/description editor for admins and owners.
export function MetadataHeader({
  name,
  description,
  hostCount,
  canEdit,
  saving,
  error,
  onSave,
}: MetadataHeaderProps) {
  const { t } = useTranslation();
  const editor = useMetadataHeaderLogic(name, description, onSave);

  if (editor.editing) {
    return (
      <form onSubmit={editor.onSubmit} noValidate className="mb-4 flex flex-col gap-3">
        <FormField
          label={t("projectDetail.meta.name")}
          data-testid="project-meta-name"
          {...editor.form.register("name")}
        />
        <FormField
          label={t("projectDetail.meta.description")}
          data-testid="project-meta-description"
          {...editor.form.register("description")}
        />
        {error ? (
          <p className="text-[13px] text-danger">{t("projectDetail.errors.updateFailed")}</p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="submit"
            loading={saving}
            disabled={!editor.canSubmit}
            data-testid="project-meta-save"
          >
            {t("projectDetail.meta.save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={editor.cancel}
            className={PAIRED_CANCEL_CLASS}
          >
            {t("projectDetail.meta.cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="break-words text-[22px] font-bold text-text">{name}</h2>
        {description ? <p className="mt-1 text-[13px] text-dim">{description}</p> : null}
        <p className="mt-1 text-[12px] text-dim">
          {t("projectDetail.hostCount", { count: hostCount })}
        </p>
      </div>
      {canEdit ? (
        <button
          type="button"
          onClick={editor.open}
          data-testid="project-meta-edit"
          className="flex flex-none items-center gap-1 text-[12.5px] text-dim hover:text-accent"
        >
          <Pencil size={13} aria-hidden />
          {t("projectDetail.meta.edit")}
        </button>
      ) : null}
    </div>
  );
}
