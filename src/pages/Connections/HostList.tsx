import { SearchX } from "lucide-react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { HostRow } from "./HostRow";
import type { HostSection } from "./useConnectionsLogic";

// Roughly six rows — the height the design shows before the list scrolls.
const MAX_LIST_HEIGHT = 360;

interface HostListProps {
  readonly sections: readonly HostSection[];
  readonly listRef: RefObject<HTMLDivElement | null>;
  readonly totalHosts: number;
  readonly query: string;
  readonly onClearFilter: () => void;
}

// The matching hosts, or the no-match state when the filter excludes them all.
// Rendered only when there are hosts to show — an empty fleet is the promoted
// <PairTerminal> instead.
export function HostList({ sections, listRef, totalHosts, query, onClearFilter }: HostListProps) {
  if (sections.length === 0) {
    return <NoMatches total={totalHosts} query={query.trim()} onClearFilter={onClearFilter} />;
  }
  // A single personal section is the original flat list — no heading, because
  // there is nothing to distinguish it from.
  const headings = sections.length > 1 || sections[0].kind === "project";
  return (
    <div
      ref={listRef}
      style={{ maxHeight: MAX_LIST_HEIGHT }}
      className="overflow-y-auto border-t border-border-subtle"
    >
      {sections.map((section) => (
        <section key={section.key}>
          {headings ? <SectionHeading section={section} /> : null}
          {section.hosts.map((host) => (
            <HostRow
              key={host.id}
              host={host}
              projectId={section.kind === "project" ? section.projectId : undefined}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

// Where these hosts come from: the project name, or the personal vault. Sticky
// so the origin of a row stays visible while the capped list scrolls — a shared
// host and a private one must never be mistaken for each other.
function SectionHeading({ section }: { readonly section: HostSection }) {
  const { t } = useTranslation();
  return (
    <h3 className="sticky top-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-card px-6 py-1.5 text-[11.5px] font-bold tracking-wide text-dim uppercase">
      {section.kind === "project" ? section.name : t("connections.personalSection")}
      <span className="text-faint normal-case">
        {t("connections.sectionCount", { count: section.hosts.length })}
      </span>
    </h3>
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
        {t("connections.fleetHostCount", { count: total })}
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
