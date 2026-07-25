import { SearchX } from "lucide-react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { VaultHost } from "@/lib/vaultDocument";
import { HostRow } from "./HostRow";

// Roughly six rows — the height the design shows before the list scrolls.
const MAX_LIST_HEIGHT = 360;

interface HostListProps {
  readonly hosts: readonly VaultHost[];
  readonly listRef: RefObject<HTMLDivElement | null>;
  readonly totalHosts: number;
  readonly query: string;
  readonly onClearFilter: () => void;
}

// The matching hosts, or the no-match state when the filter excludes them all.
// Rendered only when the vault holds hosts — an empty vault is the promoted
// <PairTerminal> instead.
export function HostList({ hosts, listRef, totalHosts, query, onClearFilter }: HostListProps) {
  if (hosts.length === 0) {
    return <NoMatches total={totalHosts} query={query.trim()} onClearFilter={onClearFilter} />;
  }
  return (
    <div
      ref={listRef}
      style={{ maxHeight: MAX_LIST_HEIGHT }}
      className="overflow-y-auto border-t border-border-subtle"
    >
      {hosts.map((host) => (
        <HostRow key={host.id} host={host} />
      ))}
    </div>
  );
}

interface NoMatchesProps {
  readonly total: number;
  readonly query: string;
  readonly onClearFilter: () => void;
}

function NoMatches({ total, query, onClearFilter }: NoMatchesProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 border-t border-border-subtle px-6 py-10 text-center">
      <SearchX size={22} aria-hidden className="text-faint" />
      <p className="text-[13.5px] text-subtle">{t("connections.noMatches", { query })}</p>
      <p className="text-[12.5px] leading-relaxed text-dim">
        {t("connections.vaultHostCount", { count: total })}
        {" · "}
        <button
          type="button"
          onClick={onClearFilter}
          data-testid="connections-no-match-clear"
          className="text-accent hover:text-accent-strong"
        >
          {"[ "}
          {t("connections.clearFilter")}
          {" ]"}
        </button>
      </p>
    </div>
  );
}
