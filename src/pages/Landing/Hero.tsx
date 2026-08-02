import { useTranslation } from "react-i18next";
import { InstallBox } from "./InstallBox";
import { TerminalMockup } from "./TerminalMockup";
import { useLandingLogic } from "./useLandingLogic";

// Left column of the hero: mono headline, body copy, the install box, and a
// platform footnote.
function HeroCopy() {
  const { t } = useTranslation();
  const { channels, selected, copied, handleCopy, handleSelect } = useLandingLogic();
  return (
    <div className="min-w-[min(100%,380px)] flex-1">
      <h1 className="m-0 font-mono text-[34px] font-bold leading-[1.15] text-text [text-wrap:pretty] sm:text-[44px]">
        {t("landing.hero.titleLine1")}
        <br />
        {t("landing.hero.titleLine2")}
      </h1>
      <p className="mt-[22px] max-w-[44ch] text-base text-muted [text-wrap:pretty] sm:text-[18px]">
        {t("landing.hero.body")}
      </p>
      <InstallBox
        channels={channels}
        selected={selected}
        copied={copied}
        onCopy={() => void handleCopy()}
        onSelect={handleSelect}
      />
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
