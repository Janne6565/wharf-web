import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LogoChip } from "@/components/LogoChip";
import {
  DATENSCHUTZ_CONTACT_LABEL,
  DATENSCHUTZ_CONTROLLER_HEADING,
  DATENSCHUTZ_CONTROLLER_LINES,
  DATENSCHUTZ_EMAIL,
  DATENSCHUTZ_HEADING,
  DATENSCHUTZ_RIGHTS_AFTER_EMAIL,
  DATENSCHUTZ_RIGHTS_BEFORE_EMAIL,
  DATENSCHUTZ_RIGHTS_HEADING,
  DATENSCHUTZ_RIGHTS_NOTE,
  DATENSCHUTZ_SECTIONS,
} from "./lib";

// Quiet header: the brand chip links home and a back link sits opposite. The
// landing nav's marketing actions have no place on a legal page.
function DatenschutzNav() {
  const { t } = useTranslation();
  return (
    <nav className="mx-auto flex max-w-[1080px] items-center gap-5 px-5 py-[22px] sm:gap-8 sm:px-8">
      <Link to="/">
        <LogoChip />
      </Link>
      <Link
        to="/"
        data-testid="datenschutz-back"
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

// Enumerated section body: the data categories, purposes and retention periods
// read as lists in the source text, so they render as lists here.
function Items({ items }: { readonly items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// The email address the controller is reachable at, as a mailto link.
function MailLink() {
  return (
    <a href={`mailto:${DATENSCHUTZ_EMAIL}`} className="text-accent hover:text-accent-strong">
      {DATENSCHUTZ_EMAIL}
    </a>
  );
}

// Privacy notice served at `/datenschutz`. Server-rendered like the landing
// page so it stays crawlable and reachable without JS — a statutory
// requirement is no use behind a client-side render. The body text is German
// by design; see `lib.ts`.
export function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-bg text-subtle">
      <DatenschutzNav />
      <main className="mx-auto max-w-[1080px] border-t border-border-subtle px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="m-0 max-w-[62ch] font-mono text-[28px] leading-[1.2] font-bold text-text sm:text-[34px]">
          {DATENSCHUTZ_HEADING}
        </h1>
        <div className="mt-10 max-w-[62ch] sm:mt-12">
          <Section heading={DATENSCHUTZ_CONTROLLER_HEADING}>
            <Lines lines={DATENSCHUTZ_CONTROLLER_LINES} />
            <p className="mt-3">
              {DATENSCHUTZ_CONTACT_LABEL} <MailLink />
            </p>
          </Section>
          {DATENSCHUTZ_SECTIONS.map((section) => (
            <Section key={section.heading} heading={section.heading}>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 first:mt-0">
                  {paragraph}
                </p>
              ))}
              {section.items ? <Items items={section.items} /> : null}
            </Section>
          ))}
          <Section heading={DATENSCHUTZ_RIGHTS_HEADING}>
            <p>
              {DATENSCHUTZ_RIGHTS_BEFORE_EMAIL} <MailLink />
              {DATENSCHUTZ_RIGHTS_AFTER_EMAIL}
            </p>
            <p className="mt-3">{DATENSCHUTZ_RIGHTS_NOTE}</p>
          </Section>
        </div>
      </main>
    </div>
  );
}
