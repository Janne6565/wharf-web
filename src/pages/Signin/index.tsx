import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { LogoChip } from "@/components/LogoChip";
import { OAuthSubline } from "@/components/OAuthSubline";
import { useSigninLogic } from "./useSigninLogic";

export function SigninPage() {
  const { t } = useTranslation();
  const { form, onSubmit, submitError, isSubmitting } = useSigninLogic();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <AuthShell topGap="signin">
      <Card maxWidth={420}>
        <LogoChip />
        <h2 className="mt-4.5 mb-1 text-[22px] text-text">{t("signin.title")}</h2>
        <OAuthSubline />

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

          {submitError ? <p className="text-[13px] text-danger">{submitError}</p> : null}

          <Button type="submit" loading={isSubmitting} data-testid="signin-submit" className="mt-2">
            {t("signin.submit")}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-dim">
          {t("signin.footerLead")}{" "}
          <Link to="/recover" className="text-accent hover:text-accent-strong">
            {t("signin.forgot")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
