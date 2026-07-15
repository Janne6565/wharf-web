import { useTranslation } from "react-i18next";
import { INSTALL_COMMAND } from "./lib";

const GITHUB_URL = "https://github.com/Janne6565/wharf-tui";

// Footer: the install one-liner on the left, secondary links on the right.
export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-6 px-8 py-14">
        <div className="font-mono text-sm text-dim">
          <span className="text-accent">$</span> {INSTALL_COMMAND}
        </div>
        <div className="ml-auto flex gap-5 text-[13px] text-dim">
          <a href="#security" className="text-dim hover:text-accent-strong">
            {t("landing.footer.security")}
          </a>
          <a href="#docs" className="text-dim hover:text-accent-strong">
            {t("landing.footer.docs")}
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-dim hover:text-accent-strong"
          >
            {t("landing.footer.github")}
          </a>
          <span>{t("landing.footer.copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
