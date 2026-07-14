import { Trans, useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { LogoChip } from "@/components/LogoChip";
import { OAuthSubline } from "@/components/OAuthSubline";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { scorePassword } from "@/lib/passwordStrength";
import { useSignupLogic } from "./useSignupLogic";

export function SignupPage() {
  const { t } = useTranslation();
  const { form, onSubmit, submitError, isSubmitting, password, understand, setUnderstand } =
    useSignupLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell step={1}>
      <Card maxWidth={440}>
        <LogoChip />
        <h2 className="mt-4.5 mb-1 text-[22px] text-text">{t("signup.title")}</h2>
        <OAuthSubline />

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

          <Alert tone="warning" className="mt-1">
            <Trans
              i18nKey="signup.warning"
              components={{ 1: <strong className="font-semibold" /> }}
            />
          </Alert>

          <div>
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

          {submitError ? <p className="text-[13px] text-danger">{submitError}</p> : null}

          <Button type="submit" loading={isSubmitting} data-testid="signup-submit" className="mt-2">
            {t("signup.submit")}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
