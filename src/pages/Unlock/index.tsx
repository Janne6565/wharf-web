import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { LogoChip } from "@/components/LogoChip";
import { useUnlockLogic } from "./useUnlockLogic";

export function UnlockPage() {
  const { t } = useTranslation();
  const { form, onSubmit, submitError, isSubmitting, email, canSubmit } = useUnlockLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell backTo="/">
      <Card label={t("cards.unlock")} maxWidth={440}>
        <LogoChip />
        <h2 className="mt-4.5 mb-1.5 text-[20px] font-bold text-text">{t("unlock.title")}</h2>
        <p className="mb-5 text-[13px] leading-relaxed text-muted">
          <Trans
            i18nKey="unlock.signedInAs"
            values={{ email: email ?? "" }}
            components={{ 1: <span className="text-text" /> }}
          />
        </p>

        <form onSubmit={onSubmit} noValidate>
          <FormField
            label={t("fields.masterPassword")}
            type="password"
            autoComplete="current-password"
            data-testid="unlock-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {submitError ? <p className="mt-4 text-[13px] text-danger">{submitError}</p> : null}

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!canSubmit}
            data-testid="unlock-submit"
            className="mt-6.5"
          >
            {t("unlock.submit")}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
