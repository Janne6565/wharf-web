import { useTranslation } from "react-i18next";
import { INSTALL_COMMAND } from "@/lib/install";
import { TerminalMockup } from "./TerminalMockup";
import { useLandingLogic } from "./useLandingLogic";

interface InstallBoxProps {
  readonly copied: boolean;
  readonly onCopy: () => void;
}

// The `$ curl … | sh` install box with the inline copy button.
function InstallBox({ copied, onCopy }: InstallBoxProps) {
  const { t } = useTranslation();
  return (
    <div
      id="install"
      className="mt-8 inline-flex max-w-full flex-wrap items-center gap-x-3.5 gap-y-2 border border-border bg-code px-[18px] py-3 font-mono text-[13px] sm:text-sm"
    >
      <span className="text-dim">$</span>
      <span className="text-text">{INSTALL_COMMAND}</span>
      <button
        type="button"
        onClick={onCopy}
        data-testid="landing-copy"
        className="border border-border px-2 py-0.5 text-xs text-accent hover:text-accent-strong"
      >
        [ {copied ? t("landing.hero.copied") : t("landing.hero.copy")} ]
      </button>
    </div>
  );
}

// Left column of the hero: mono headline with a blinking block cursor, body
// copy, the install box, and a platform footnote.
function HeroCopy() {
  const { t } = useTranslation();
  const { copied, handleCopy } = useLandingLogic();
  return (
    <div className="min-w-[min(100%,380px)] flex-1">
      <h1 className="m-0 font-mono text-[34px] font-bold leading-[1.15] text-text [text-wrap:pretty] sm:text-[44px]">
        {t("landing.hero.titleLine1")}
        <br />
        {t("landing.hero.titleLine2")}
        <span className="ml-2 inline-block h-[0.9em] w-[0.5em] animate-blink bg-accent" />
      </h1>
      <p className="mt-[22px] max-w-[44ch] text-base text-muted [text-wrap:pretty] sm:text-[18px]">
        {t("landing.hero.body")}
      </p>
      <InstallBox copied={copied} onCopy={() => void handleCopy()} />
      <div className="mt-3.5 text-[13px] text-dim">{t("landing.hero.footnote")}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-10 px-5 pt-12 pb-14 sm:gap-14 sm:px-8 sm:pt-[72px] sm:pb-20">
      <HeroCopy />
      <div className="min-w-[min(100%,420px)] flex-[1.1]">
        <TerminalMockup />
      </div>
    </section>
  );
}
