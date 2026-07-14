import { useTranslation } from "react-i18next";

// The "or continue with Google / GitHub" subline shared by sign-up and sign-in.
// Social login has no backend yet, so it renders disabled with a "coming soon"
// hint rather than a live link.
export function OAuthSubline() {
  const { t } = useTranslation();
  return (
    <div className="mb-6 text-sm text-dim">
      {t("common.or")}{" "}
      <span className="cursor-not-allowed text-accent/60" title={t("common.comingSoon")}>
        {t("common.continueWithProviders")}
      </span>{" "}
      <span className="text-dim">({t("common.comingSoon")})</span>
    </div>
  );
}
