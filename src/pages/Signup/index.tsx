import { Trans, useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { LogoChip } from "@/components/LogoChip";
import { OAuthButtons } from "@/components/OAuthButtons";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { scorePassword } from "@/lib/passwordStrength";
import { useSignupLogic } from "./useSignupLogic";

export function SignupPage() {
  const { t } = useTranslation();
  const {
    form,
    onSubmit,
    submitError,
    isSubmitting,
    password,
    understand,
    setUnderstand,
    canSubmit,
  } = useSignupLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell step={1} backTo="/">
      <Card label={t("cards.signup")} maxWidth={460}>
        <LogoChip />
        <h2 className="mt-4.5 mb-4 text-[20px] font-bold text-text">{t("signup.title")}</h2>
        <OAuthButtons />

        <form onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField
              label={t("fields.email")}
              type="email"
              autoComplete="email"
              data-testid="signup-email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              label={t("fields.masterPassword")}
              type="password"
              autoComplete="new-password"
              data-testid="signup-password"
              error={errors.password?.message}
              below={password ? <PasswordStrengthMeter score={scorePassword(password)} /> : null}
              {...register("password")}
            />
            <FormField
              label={t("fields.confirmPassword")}
              type="password"
              autoComplete="new-password"
              data-testid="signup-confirm"
              error={errors.confirm?.message}
              {...register("confirm")}
            />
          </div>

          <Alert tone="warning" className="mt-5.5">
            <Trans
              i18nKey="signup.warning"
              components={{ 1: <strong className="font-semibold" /> }}
            />
          </Alert>

          <div className="mt-4.5">
            <Checkbox
              checked={understand}
              onCheckedChange={setUnderstand}
              label={t("signup.understand")}
              data-testid="signup-understand"
            />
            {errors.understand?.message ? (
              <p className="mt-1.5 text-[13px] text-danger">{errors.understand.message}</p>
            ) : null}
          </div>

          {submitError ? <p className="mt-4 text-[13px] text-danger">{submitError}</p> : null}

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!canSubmit}
            data-testid="signup-submit"
            className="mt-6.5"
          >
            {t("signup.submit")}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
