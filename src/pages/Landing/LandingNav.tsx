import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogoChip } from "@/components/LogoChip";

// Landing top nav: brand chip, in-page anchor links, and the sign-in / get-wharf
// actions on the right.
export function LandingNav() {
  const { t } = useTranslation();
  return (
    <nav className="mx-auto flex max-w-[1080px] items-center gap-8 px-8 py-[22px]">
      <LogoChip />
      <div className="flex gap-6 text-sm text-muted">
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
        <Link to="/signin" className="text-sm text-muted hover:text-accent-strong">
          {t("landing.nav.signIn")}
        </Link>
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
