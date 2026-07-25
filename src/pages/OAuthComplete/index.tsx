import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { LogoChip } from "@/components/LogoChip";
import { Spinner } from "@/components/Spinner";
import {
  isUnverifiedAccountError,
  type OAuthErrorCode,
  useOAuthCompleteLogic,
} from "./useOAuthCompleteLogic";

interface OAuthCompletePageProps {
  // The raw ?error= code from the backend redirect, validated by the route.
  readonly error?: string;
}

function OAuthError({ code }: { readonly code: OAuthErrorCode }) {
  const { t } = useTranslation();
  return (
    <div data-testid="oauth-error">
      <LogoChip />
      <h2 className="mt-4.5 mb-2 text-[20px] font-bold text-text">
        {t("oauthComplete.errorTitle")}
      </h2>
      <p className="text-[13px] leading-relaxed text-muted">{t(`oauthComplete.error.${code}`)}</p>
      <div className="mt-6 flex flex-col gap-2 text-[13px]">
        {/* The callback redirect carries no address, so the verification step
            can't be deep-linked from here — sign in is where the user names the
            account, and it links on to /welcome/verify-email from there. */}
        <Link
          to="/signin"
          data-testid={isUnverifiedAccountError(code) ? "oauth-verify-email" : undefined}
          className="text-accent hover:text-accent-strong"
        >
          {isUnverifiedAccountError(code)
            ? t("oauthComplete.verifyEmail")
            : t("oauthComplete.backToSignin")}
        </Link>
        <Link to="/signup" className="text-accent hover:text-accent-strong">
          {t("oauthComplete.backToSignup")}
        </Link>
      </div>
    </div>
  );
}

function OAuthLoading() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted" data-testid="oauth-loading">
      <Spinner className="text-accent" />
      {t("oauthComplete.loading")}
    </div>
  );
}

export function OAuthCompletePage({ error }: OAuthCompletePageProps) {
  const { t } = useTranslation();
  const { errorCode } = useOAuthCompleteLogic(error);

  return (
    <AuthShell>
      <Card label={t("cards.oauth")} maxWidth={440}>
        {errorCode ? <OAuthError code={errorCode} /> : <OAuthLoading />}
      </Card>
    </AuthShell>
  );
}
