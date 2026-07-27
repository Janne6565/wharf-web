import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  // Where "back" goes. Always an explicit route, never history.back(): a screen
  // reached by a deep link or a redirect has no meaningful history entry, and a
  // back control that lands somewhere different each time is not one control.
  readonly to: string;
  // "pinned" positions it in the screen's top-left corner, for shells that
  // render no header row of their own (the auth screens). "inline" leaves
  // placement to the caller, which puts it at the head of its header row.
  readonly placement?: "pinned" | "inline";
}

// The one back control in the app. Every screen that can be left renders this
// and nothing else: same icon, same border, same "back" label, same top-left
// position. Screens used to carry up to two competing variants — a pinned one
// from the shell and a second inside the card — which read as two different
// actions when they went to the same place.
export function BackLink({ to, placement = "inline" }: BackLinkProps) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      data-testid="back-link"
      className={cn(
        "flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-[13px] text-muted hover:border-accent hover:text-accent",
        placement === "pinned" && "absolute top-4 left-4 sm:top-6 sm:left-7",
      )}
    >
      <ArrowLeft size={14} aria-hidden />
      {t("common.back")}
    </Link>
  );
}
