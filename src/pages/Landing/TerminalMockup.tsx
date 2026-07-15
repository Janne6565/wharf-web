import { cn } from "@/lib/utils";
import {
  TERMINAL_HELP,
  TERMINAL_HOSTS,
  TERMINAL_KEYS,
  TERMINAL_SYNCED,
  TERMINAL_TITLE,
  type TerminalHost,
} from "./lib";

// Static, faithful decoration of the wharf TUI beside the hero. Not interactive.

function TitleBar() {
  return (
    <div className="flex items-center gap-1.5 border-b border-border-subtle px-3.5 py-2.5">
      <span className="h-2.5 w-2.5 bg-danger" />
      <span className="h-2.5 w-2.5 bg-warn" />
      <span className="h-2.5 w-2.5 bg-success" />
      <span className="ml-2.5 font-mono text-xs text-dim">{TERMINAL_TITLE}</span>
    </div>
  );
}

function TabRow() {
  return (
    <div className="flex items-baseline gap-2.5 px-4 pb-2">
      <span className="bg-accent px-[7px] font-bold text-accent-ink">❯_ wharf</span>
      <span className="bg-row-active px-2 text-accent">1:hosts</span>
      <span className="text-dim">2:projects</span>
      <span className="text-dim">3:keys</span>
      <span className="ml-auto text-success">{TERMINAL_SYNCED}</span>
    </div>
  );
}

function HostRow({ host }: { readonly host: TerminalHost }) {
  return (
    <div className={cn("flex gap-2.5 px-4 py-px", host.selected && "bg-row-active")}>
      {host.selected ? <span className="text-accent">▸</span> : <span className="w-[1ch]" />}
      <span className={cn("min-w-[14ch]", host.selected ? "text-accent" : "text-subtle")}>
        {host.name}
      </span>
      <span className="flex-1 text-dim">{host.target}</span>
      <span className="text-blue">{host.tags}</span>
      <span className={host.online ? "text-success" : "text-dim"}>● {host.status}</span>
    </div>
  );
}

function KeyHints() {
  return (
    <div className="mt-2 flex gap-3.5 border-t border-border-subtle px-4 pt-1.5 text-dim">
      {TERMINAL_KEYS.map((hint) => (
        <span key={hint.key}>
          <span className="text-accent">{hint.key}</span> {hint.label}
        </span>
      ))}
      <span className="ml-auto">
        <span className="text-accent">{TERMINAL_HELP.key}</span> {TERMINAL_HELP.label}
      </span>
    </div>
  );
}

export function TerminalMockup() {
  return (
    <div className="overflow-hidden border border-border bg-card shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <TitleBar />
      <div className="pt-3.5 pb-2.5 font-mono text-[12.5px] leading-[1.7]">
        <TabRow />
        <div className="border-t border-border-subtle pt-2 pb-0.5">
          {TERMINAL_HOSTS.map((host) => (
            <HostRow key={host.name} host={host} />
          ))}
        </div>
        <KeyHints />
      </div>
    </div>
  );
}
