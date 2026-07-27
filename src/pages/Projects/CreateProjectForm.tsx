import { Plus } from "lucide-react";
import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, PAIRED_CANCEL_CLASS } from "@/components/Button";
import { FormField } from "@/components/FormField";

interface CreateValues {
  name: string;
  description: string;
}

interface CreateProjectFormProps {
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly form: UseFormReturn<CreateValues>;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly canSubmit: boolean;
  readonly loading: boolean;
  readonly error: boolean;
  // True while the identity bootstrap is not yet ready — creation needs the
  // owner's public key, so the trigger is disabled until then.
  readonly disabled: boolean;
}

// The create-project affordance: a "new project" trigger that expands into a
// small name + description form. Creation is a fully client-side crypto flow
// (fresh DEK → sealed empty blob → DEK wrapped to the owner) handled in the hook.
export function CreateProjectForm({
  open,
  onToggle,
  form,
  onSubmit,
  canSubmit,
  loading,
  error,
  disabled,
}: CreateProjectFormProps) {
  const { t } = useTranslation();
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        data-testid="projects-create-toggle"
        className="flex items-center gap-1.5 text-[13px] text-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:text-dim"
      >
        <Plus size={15} aria-hidden />
        {t("projects.create.toggle")}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 border border-border p-4">
      <FormField
        label={t("projects.create.name")}
        data-testid="projects-create-name"
        {...form.register("name")}
      />
      <FormField
        label={t("projects.create.description")}
        data-testid="projects-create-description"
        {...form.register("description")}
      />
      {error ? (
        <p className="text-[13px] text-danger">{t("projects.errors.createFailed")}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          loading={loading}
          disabled={!canSubmit}
          data-testid="projects-create-submit"
        >
          {t("projects.create.submit")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onToggle}
          className={PAIRED_CANCEL_CLASS}
        >
          {t("projects.create.cancel")}
        </Button>
      </div>
    </form>
  );
}
