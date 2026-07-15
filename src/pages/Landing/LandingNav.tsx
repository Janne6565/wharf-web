import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthInformation } from "@/auth/useAuthInformation";
import { LogoChip } from "@/components/LogoChip";

// Landing top nav: brand chip, in-page anchor links, and the account action on
// the right. A signed-in visitor keeps their session (the silent refresh runs
// on load) and sees a link to their profile instead of a sign-in link; the
// profile link leads to the vault-unlock screen, then on to their connections.
export function LandingNav() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthInformation();
  return (
    <nav className="mx-auto flex max-w-[1080px] items-center gap-5 px-5 py-[22px] sm:gap-8 sm:px-8">
      <LogoChip />
      {/* In-page anchors are redundant on a phone-length page — hide them and
          keep the brand + actions row compact. */}
      <div className="hidden gap-6 text-sm text-muted sm:flex">
        <a href="#features" className="text-muted hover:text-accent-strong">
          {t("landing.nav.features")}
        </a>
        <a href="#security" className="text-muted hover:text-accent-strong">
          {t("landing.nav.security")}
        </a>
        <a href="#install" className="text-muted hover:text-accent-strong">
          {t("landing.nav.install")}
        </a>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {isAuthenticated ? (
          <Link
            to="/unlock"
            data-testid="landing-profile"
            className="border border-accent px-3.5 py-1.5 font-mono text-[13px] text-accent hover:text-accent-strong"
          >
            [ {t("landing.nav.profile")} ]
          </Link>
        ) : (
          <Link
            to="/signin"
            data-testid="landing-signin"
            className="text-sm text-muted hover:text-accent-strong"
          >
            {t("landing.nav.signIn")}
          </Link>
        )}
        <a
          href="#install"
          className="border border-accent px-3.5 py-1.5 font-mono text-[13px] text-accent hover:text-accent-strong"
        >
          [ {t("landing.nav.getWharf")} ]
        </a>
      </div>
    </nav>
  );
}
