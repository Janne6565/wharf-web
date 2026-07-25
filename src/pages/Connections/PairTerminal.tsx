import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface PairTerminalProps {
  // Promoted turns the quiet footer strip into the centred empty state: same
  // element, larger presentation. Having exactly ONE component means the pair
  // link can never be rendered twice on the same screen.
  readonly promoted?: boolean;
}

// "hosts are added from your terminal, never here" plus the way to pair one.
// The connections card renders this exactly once — as a footer strip under the
// host list, or promoted into the empty state when there are no hosts at all.
export function PairTerminal({ promoted = false }: PairTerminalProps) {
  const { t } = useTranslation();
  if (promoted) {
    return (
      <div
        data-testid="pair-terminal"
        className="flex flex-col items-center gap-3.5 border-t border-border bg-input px-6 py-[34px] text-center"
      >
        <span className="flex size-10 items-center justify-center border border-accent text-accent">
          <Terminal size={19} aria-hidden />
        </span>
        <div>
          <div className="text-[15px] font-bold text-text">{t("connections.pair.emptyTitle")}</div>
          <p className="mt-1.5 max-w-[400px] text-[12.5px] leading-relaxed text-muted">
            <Trans
              i18nKey="connections.pair.emptyBody"
              components={{ 1: <span className="text-text" /> }}
            />
          </p>
        </div>
        <PairLink className="border border-accent px-4 py-[9px] text-[13px] font-bold" />
      </div>
    );
  }
  return (
    <div
      data-testid="pair-terminal"
      className="flex items-center gap-3 border-t border-border bg-input px-6 py-3.5"
    >
      <Terminal size={15} aria-hidden className="shrink-0 text-dim" />
      <span className="flex-1 text-[12.5px] text-dim">{t("connections.pair.footerNote")}</span>
      <PairLink />
    </div>
  );
}

// The pair link itself, bracketed like every other action in the v2 design.
function PairLink({ className }: { readonly className?: string }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/device"
      search={{ onboarding: false }}
      data-testid="pair-terminal-link"
      className={cn("shrink-0 text-[12.5px] text-accent hover:text-accent-strong", className)}
    >
      {"[ "}
      {t("connections.pairTerminal")}
      {" ]"}
    </Link>
  );
}
