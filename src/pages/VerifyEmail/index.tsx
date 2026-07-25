import { Trans, useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { VERIFICATION_CODE_LENGTH } from "@/lib/validators";
import { useVerifyEmailLogic } from "./useVerifyEmailLogic";

interface VerifyEmailPageProps {
  // The ?email= search param, validated by the route. Absent during onboarding,
  // where the address comes from the in-memory handoff instead.
  readonly email?: string;
}

export function VerifyEmailPage({ email: emailParam }: VerifyEmailPageProps) {
  const { t } = useTranslation();
  const {
    form,
    email,
    onSubmit,
    submitError,
    isSubmitting,
    canSubmit,
    handleResend,
    resent,
    isResending,
    cooldown,
  } = useVerifyEmailLogic(emailParam);
  const { register, formState } = form;
  const { errors } = formState;

  return (
    // Step [3] of onboarding. Forward-only like the other onboarding screens, so
    // no back link: the previous step showed a recovery code we no longer hold.
    <AuthShell step={3}>
      <Card label={t("cards.verifyEmail")} maxWidth={460}>
        <h2 className="mb-1.5 text-[20px] font-bold text-text">{t("verifyEmail.title")}</h2>
        <p className="mb-6 text-[13px] leading-relaxed text-muted">
          <Trans
            i18nKey="verifyEmail.intro"
            values={{ email }}
            components={{ 1: <span className="text-text" /> }}
          />
        </p>

        <form onSubmit={onSubmit} noValidate>
          <FormField
            label={t("fields.verificationCode")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={VERIFICATION_CODE_LENGTH}
            data-testid="verify-code"
            error={errors.code?.message}
            {...register("code")}
          />

          {submitError ? <p className="mt-4 text-[13px] text-danger">{submitError}</p> : null}

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!canSubmit}
            data-testid="verify-submit"
            className="mt-6.5"
          >
            {t("verifyEmail.submit")}
          </Button>
        </form>

        <div className="mt-5 border-t border-border pt-4 text-center text-[12.5px] text-dim">
          {resent ? (
            <p className="mb-2 text-muted" data-testid="verify-resent">
              {t("verifyEmail.resent")}
            </p>
          ) : null}
          <Button
            variant="ghost"
            loading={isResending}
            disabled={cooldown > 0}
            onClick={handleResend}
            data-testid="verify-resend"
          >
            {cooldown > 0
              ? t("verifyEmail.resendIn", { seconds: String(cooldown) })
              : t("verifyEmail.resend")}
          </Button>
        </div>
      </Card>
    </AuthShell>
  );
}
