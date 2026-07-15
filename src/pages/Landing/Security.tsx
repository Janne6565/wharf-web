import { Check, X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface CheckItem {
  readonly text: string;
  readonly danger: boolean;
}

// One square checklist card: a 3px accent (or danger) left border and a check
// or cross icon.
function ChecklistCard({ item }: { readonly item: CheckItem }) {
  const Icon = item.danger ? X : Check;
  return (
    <div
      className={cn(
        "flex gap-3.5 border border-l-[3px] border-border bg-bg px-[18px] py-3.5",
        item.danger ? "border-l-danger" : "border-l-accent",
      )}
    >
      <Icon
        size={16}
        strokeWidth={3}
        aria-hidden
        className={cn("mt-0.5 flex-none", item.danger ? "text-danger" : "text-accent")}
      />
      <span className="text-muted">{item.text}</span>
    </div>
  );
}

// Zero-knowledge security band: prose on the left, a mono checklist on the right.
export function Security() {
  const { t } = useTranslation();
  const items: readonly CheckItem[] = [
    { text: t("landing.security.check1"), danger: false },
    { text: t("landing.security.check2"), danger: false },
    { text: t("landing.security.check3"), danger: false },
    { text: t("landing.security.check4"), danger: true },
  ];
  return (
    <section id="security" className="border-t border-border-subtle bg-card">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-start gap-10 px-5 py-14 sm:gap-14 sm:px-8 sm:py-[72px]">
        <div className="min-w-[min(100%,360px)] flex-1">
          <div className="font-mono text-sm text-accent">{t("landing.security.kicker")}</div>
          <h2 className="mt-3 font-mono text-2xl leading-[1.25] text-text [text-wrap:pretty] sm:text-[30px]">
            {t("landing.security.headingLine1")}
            <br />
            {t("landing.security.headingLine2")}
          </h2>
          <p className="mt-[18px] max-w-[48ch] text-base text-muted [text-wrap:pretty]">
            {t("landing.security.para1")}
          </p>
          <p className="mt-3.5 max-w-[48ch] text-base text-muted [text-wrap:pretty]">
            <Trans
              i18nKey="landing.security.para2"
              components={{ 1: <span className="text-warn" /> }}
            />
          </p>
        </div>
        <div className="flex min-w-[min(100%,360px)] flex-1 flex-col gap-3 font-mono text-[13.5px]">
          {items.map((item) => (
            <ChecklistCard key={item.text} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
