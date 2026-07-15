import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { LogoChip } from "@/components/LogoChip";
import { OAuthButtons } from "@/components/OAuthButtons";
import { useSigninLogic } from "./useSigninLogic";

export function SigninPage() {
  const { t } = useTranslation();
  const { form, onSubmit, submitError, isSubmitting } = useSigninLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell topGap="signin">
      <Card label={t("cards.signin")} maxWidth={440} backTo="/">
        <LogoChip />
        <h2 className="mt-4.5 mb-4 text-[20px] font-bold text-text">{t("signin.title")}</h2>
        <OAuthButtons />

        <form onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-5">
            <FormField
              label={t("fields.email")}
              type="email"
              autoComplete="email"
              data-testid="signin-email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              label={t("fields.masterPassword")}
              type="password"
              autoComplete="current-password"
              data-testid="signin-password"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          {submitError ? <p className="mt-4 text-[13px] text-danger">{submitError}</p> : null}

          <Button
            type="submit"
            loading={isSubmitting}
            data-testid="signin-submit"
            className="mt-6.5"
          >
            {t("signin.submit")}
          </Button>
        </form>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-dim">
          {t("signin.footerLead")}
          <br />
          <Link to="/recover" className="text-accent hover:text-accent-strong">
            {t("signin.forgot")}
          </Link>
        </p>
        <p className="mt-5 border-t border-border pt-3.5 text-center text-[12.5px] text-dim">
          {t("signin.newHere")}{" "}
          <Link to="/signup" className="text-accent hover:text-accent-strong">
            {t("signin.createAccount")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
