import { useTranslation } from "react-i18next";
import type { InstallChannel } from "@/lib/install";
import { cn } from "@/lib/utils";

interface InstallTabsProps {
  readonly channels: readonly InstallChannel[];
  readonly selectedId: string | undefined;
  readonly onSelect: (id: string) => void;
}

// Tab strip listing only the channels the visitor's platform can run.
function InstallTabs({ channels, selectedId, onSelect }: InstallTabsProps) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("landing.hero.channels")}
      className="flex flex-wrap gap-0.5 border-b border-border-subtle px-2.5 pt-2"
    >
      {channels.map((channel) => (
        <button
          key={channel.id}
          type="button"
          role="tab"
          aria-selected={channel.id === selectedId}
          data-testid={`install-tab-${channel.id}`}
          onClick={() => onSelect(channel.id)}
          className={cn(
            "px-2.5 pt-[3px] pb-1.5 text-xs",
            channel.id === selectedId ? "bg-row-active text-accent" : "text-dim hover:text-muted",
          )}
        >
          {channel.label}
        </button>
      ))}
    </div>
  );
}

// A shell prompt per command line. Continuation lines are indented and get no
// prompt, so a wrapped command still reads as one instruction rather than
// several — which matters for apt, whose setup is genuinely multi-step.
function CommandLines({ command }: { readonly command: string }) {
  return (
    <div className="flex-1 overflow-x-auto">
      {command.split("\n").map((line) => (
        <div key={line} className="flex gap-3.5 whitespace-pre">
          <span className="text-dim">{line.startsWith(" ") ? " " : "$"}</span>
          <span className="text-text">{line}</span>
        </div>
      ))}
    </div>
  );
}

interface InstallBoxProps {
  readonly channels: readonly InstallChannel[];
  readonly selected: InstallChannel | null;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onSelect: (id: string) => void;
}

// The install box: platform-filtered tabs above the selected channel's command,
// with an inline copy button.
export function InstallBox({ channels, selected, copied, onCopy, onSelect }: InstallBoxProps) {
  const { t } = useTranslation();
  if (!selected) return null;
  return (
    <div
      id="install"
      className="mt-8 inline-block max-w-full border border-border bg-code font-mono text-[13px] sm:text-sm"
    >
      <InstallTabs channels={channels} selectedId={selected.id} onSelect={onSelect} />
      <div className="flex items-start gap-3.5 px-[18px] py-3">
        <CommandLines command={selected.command} />
        <button
          type="button"
          onClick={onCopy}
          data-testid="landing-copy"
          className="shrink-0 border border-border px-2 py-0.5 text-xs text-accent hover:text-accent-strong"
        >
          [ {copied ? t("landing.hero.copied") : t("landing.hero.copy")} ]
        </button>
      </div>
    </div>
  );
}
