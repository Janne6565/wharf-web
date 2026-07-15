import { Check } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { cn } from "@/lib/utils";
import { useRecoverLogic } from "./useRecoverLogic";

const dangerEmphasis = { 1: <strong className="font-semibold" /> };

export function RecoverPage() {
  const { t } = useTranslation();
  const { form, onSubmit, phase, verifyError, submitError, isVerifying, isSubmitting, canSubmit } =
    useRecoverLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell backTo="/signin">
      <Card label={t("cards.recover")} maxWidth={500}>
        <h2 className="mb-1.5 text-[20px] font-bold text-text">{t("recover.title")}</h2>
        <p className="mb-6 text-[13px] leading-relaxed text-muted">{t("recover.intro")}</p>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {/* The design omits the email field, but the recovery flow verifies the
              code against a specific account, so it stays a functional necessity. */}
          <FormField
            label={t("fields.email")}
            type="email"
            autoComplete="email"
            data-testid="recover-email"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <div
              className={cn(
                "relative border bg-input transition-colors focus-within:border-accent",
                errors.recoveryCode ? "border-danger" : "border-border",
              )}
            >
              <textarea
                id="recover-code"
                rows={2}
                spellCheck={false}
                autoCapitalize="characters"
                data-testid="recover-code"
                className="peer w-full resize-none bg-transparent px-3.5 py-3 text-[14px] leading-[1.7] tracking-wide text-text outline-none"
                {...register("recoveryCode")}
              />
              <label
                htmlFor="recover-code"
                className="pointer-events-none absolute -top-[9px] left-2.5 bg-card px-1.5 text-[12px] text-dim peer-focus:text-accent"
              >
                {t("fields.recoveryCode")}
              </label>
            </div>
            {errors.recoveryCode?.message ? (
              <p className="mt-1.5 text-[13px] text-danger">{errors.recoveryCode.message}</p>
            ) : null}
            <RecoveryStatus phase={phase} isVerifying={isVerifying} verifyError={verifyError} />
          </div>

          <FormField
            label={t("fields.newMasterPassword")}
            type="password"
            autoComplete="new-password"
            data-testid="recover-new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <Alert tone="danger">
            <Trans i18nKey="recover.danger" components={dangerEmphasis} />
          </Alert>

          {submitError ? <p className="text-[13px] text-danger">{submitError}</p> : null}

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!canSubmit}
            data-testid="recover-submit"
          >
            {t("recover.submit")}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}

interface RecoveryStatusProps {
  readonly phase: "idle" | "verifying" | "valid";
  readonly isVerifying: boolean;
  readonly verifyError: string | null;
}

function RecoveryStatus({ phase, isVerifying, verifyError }: RecoveryStatusProps) {
  const { t } = useTranslation();
  if (verifyError) {
    return <p className="mt-2 text-[13px] text-danger">{verifyError}</p>;
  }
  if (isVerifying || phase === "verifying") {
    return <p className="mt-2 text-[13px] text-muted">{t("recover.verifying")}</p>;
  }
  if (phase === "valid") {
    return (
      <p
        className="mt-2 flex items-center gap-2 text-[13px] text-success"
        data-testid="recover-valid"
      >
        <Check size={14} strokeWidth={3} aria-hidden />
        {t("recover.valid")}
      </p>
    );
  }
  return null;
}
