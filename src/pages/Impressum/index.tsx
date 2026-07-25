import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LogoChip } from "@/components/LogoChip";
import {
  IMPRESSUM_CONTACT_HEADING,
  IMPRESSUM_CONTACT_LABEL,
  IMPRESSUM_EMAIL,
  IMPRESSUM_HEADING,
  IMPRESSUM_PROVIDER_HEADING,
  IMPRESSUM_PROVIDER_LINES,
  IMPRESSUM_RESPONSIBLE_HEADING,
  IMPRESSUM_RESPONSIBLE_LINES,
  IMPRESSUM_SECTIONS,
  IMPRESSUM_VAT,
} from "./lib";

// Quiet header: the brand chip links home and a back link sits opposite. The
// landing nav's marketing actions have no place on a legal page.
function ImpressumNav() {
  const { t } = useTranslation();
  return (
    <nav className="mx-auto flex max-w-[1080px] items-center gap-5 px-5 py-[22px] sm:gap-8 sm:px-8">
      <Link to="/">
        <LogoChip />
      </Link>
      <Link
        to="/"
        data-testid="impressum-back"
        className="ml-auto flex items-center gap-1.5 text-[13px] text-dim hover:text-accent-strong"
      >
        <ArrowLeft size={14} aria-hidden />
        {t("common.back")}
      </Link>
    </nav>
  );
}

interface SectionProps {
  readonly heading: string;
  readonly children: ReactNode;
}

// One legal section: a mono heading over its body, with generous space above.
function Section({ heading, children }: SectionProps) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-mono text-base text-text [text-wrap:pretty] sm:text-[17px]">{heading}</h2>
      <div className="mt-3 text-[15px] leading-[1.7] text-muted [text-wrap:pretty]">{children}</div>
    </section>
  );
}

// Address-style block: one line per row, so it reads like a letterhead.
function Lines({ lines }: { readonly lines: readonly string[] }) {
  return (
    <p>
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </p>
  );
}

// Legal notice served at `/impressum`. Server-rendered like the landing page so
// it stays crawlable and reachable without JS — a statutory requirement is no
// use behind a client-side render. The body text is German by design; see `lib.ts`.
export function ImpressumPage() {
  return (
    <div className="min-h-screen bg-bg text-subtle">
      <ImpressumNav />
      <main className="mx-auto max-w-[1080px] border-t border-border-subtle px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="m-0 max-w-[62ch] font-mono text-[28px] leading-[1.2] font-bold text-text sm:text-[34px]">
          {IMPRESSUM_HEADING}
        </h1>
        <div className="mt-10 max-w-[62ch] sm:mt-12">
          <Section heading={IMPRESSUM_PROVIDER_HEADING}>
            <Lines lines={IMPRESSUM_PROVIDER_LINES} />
          </Section>
          <Section heading={IMPRESSUM_CONTACT_HEADING}>
            <p>
              {IMPRESSUM_CONTACT_LABEL}{" "}
              <a
                href={`mailto:${IMPRESSUM_EMAIL}`}
                className="text-accent hover:text-accent-strong"
              >
                {IMPRESSUM_EMAIL}
              </a>
            </p>
          </Section>
          <Section heading={IMPRESSUM_VAT.heading}>
            <p>{IMPRESSUM_VAT.body}</p>
          </Section>
          <Section heading={IMPRESSUM_RESPONSIBLE_HEADING}>
            <Lines lines={IMPRESSUM_RESPONSIBLE_LINES} />
          </Section>
          {IMPRESSUM_SECTIONS.map((section) => (
            <Section key={section.heading} heading={section.heading}>
              <p>{section.body}</p>
            </Section>
          ))}
        </div>
      </main>
    </div>
  );
}
