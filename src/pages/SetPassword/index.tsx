import { Trans, useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { LogoChip } from "@/components/LogoChip";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { scorePassword } from "@/lib/passwordStrength";
import { useSetPasswordLogic } from "./useSetPasswordLogic";

export function SetPasswordPage() {
  const { t } = useTranslation();
  const {
    form,
    onSubmit,
    submitError,
    isSubmitting,
    ready,
    password,
    understand,
    setUnderstand,
    canSubmit,
  } = useSetPasswordLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell step={2}>
      <Card label={t("cards.setPassword")} maxWidth={460}>
        <LogoChip />
        <h2 className="mt-4.5 mb-1.5 text-[20px] font-bold text-text">{t("setPassword.title")}</h2>
        <p className="mb-5 text-[13px] leading-relaxed text-muted">{t("setPassword.subtitle")}</p>

        <form onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField
              label={t("fields.masterPassword")}
              type="password"
              autoComplete="new-password"
              data-testid="setpassword-password"
              error={errors.password?.message}
              below={password ? <PasswordStrengthMeter score={scorePassword(password)} /> : null}
              {...register("password")}
            />
            <FormField
              label={t("fields.confirmPassword")}
              type="password"
              autoComplete="new-password"
              data-testid="setpassword-confirm"
              error={errors.confirm?.message}
              {...register("confirm")}
            />
          </div>

          <Alert tone="warning" className="mt-5.5">
            <Trans
              i18nKey="setPassword.warning"
              components={{ 1: <strong className="font-semibold" /> }}
            />
          </Alert>

          <div className="mt-4.5">
            <Checkbox
              checked={understand}
              onCheckedChange={setUnderstand}
              label={t("setPassword.understand")}
              data-testid="setpassword-understand"
            />
            {errors.understand?.message ? (
              <p className="mt-1.5 text-[13px] text-danger">{errors.understand.message}</p>
            ) : null}
          </div>

          {submitError ? <p className="mt-4 text-[13px] text-danger">{submitError}</p> : null}

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!ready || !canSubmit}
            data-testid="setpassword-submit"
            className="mt-6.5"
          >
            {t("setPassword.submit")}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
