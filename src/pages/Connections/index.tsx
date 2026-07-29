import { LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { cn } from "@/lib/utils";
import { HostFilter } from "./HostFilter";
import { HostList } from "./HostList";
import { LockedVault } from "./LockedVault";
import { PairTerminal } from "./PairTerminal";
import { useConnectionsLogic } from "./useConnectionsLogic";

const CARD_WIDTH = 640;

// The post-auth hub. Two states in one card: sealed vault (unlock form), or the
// unlocked host list — which itself is either the list or, with nothing stored,
// the promoted pair-a-terminal invitation. The list spans the whole fleet: the
// personal vault plus every project this account can decrypt.
export function ConnectionsPage() {
  const { t } = useTranslation();
  const {
    form,
    onSubmit,
    unlockError,
    isUnlocking,
    canSubmit,
    vaultUnlocked,
    noVault,
    sections,
    shownHosts,
    totalHosts,
    projectsLoading,
    unreadableProjects,
    query,
    setQuery,
    clearFilter,
    listRef,
    listOverflowing,
    lockedHostCount,
    handleLock,
  } = useConnectionsLogic();
  const open = vaultUnlocked || noVault;

  return (
    <AppShell nav="account" width={CARD_WIDTH}>
      <Card
        label={open ? t("cards.connections") : t("cards.lockedVault")}
        maxWidth={CARD_WIDTH}
        // The open card runs its rows and strips edge to edge; the locked one
        // is an ordinary padded panel.
        padded={!open}
      >
        {open ? (
          <UnlockedBody
            sections={sections}
            shownHosts={shownHosts}
            totalHosts={totalHosts}
            projectsLoading={projectsLoading}
            unreadableProjects={unreadableProjects}
            query={query}
            setQuery={setQuery}
            clearFilter={clearFilter}
            onLock={handleLock}
            listRef={listRef}
          />
        ) : (
          <LockedVault
            form={form}
            onSubmit={onSubmit}
            error={unlockError}
            loading={isUnlocking}
            canSubmit={canSubmit}
            hostCount={lockedHostCount}
          />
        )}
      </Card>
      {open && totalHosts > 0 && shownHosts > 0 ? (
        <ListHint shown={shownHosts} total={totalHosts} overflowing={listOverflowing} />
      ) : null}
    </AppShell>
  );
}

interface UnlockedBodyProps {
  readonly sections: ReturnType<typeof useConnectionsLogic>["sections"];
  readonly shownHosts: number;
  readonly totalHosts: number;
  readonly projectsLoading: boolean;
  readonly unreadableProjects: number;
  readonly query: string;
  readonly setQuery: (value: string) => void;
  readonly clearFilter: () => void;
  readonly onLock: () => void;
  readonly listRef: ReturnType<typeof useConnectionsLogic>["listRef"];
}

// The open vault. <PairTerminal> appears exactly once in either branch — as the
// promoted empty state, or as the footer strip under the list.
function UnlockedBody({
  sections,
  shownHosts,
  totalHosts,
  projectsLoading,
  unreadableProjects,
  query,
  setQuery,
  clearFilter,
  onLock,
  listRef,
}: UnlockedBodyProps) {
  // Only truly empty once the shared blobs have been decrypted too — promoting
  // "no hosts yet" while projects are still loading would be a lie that
  // corrects itself a moment later.
  const empty = totalHosts === 0 && !projectsLoading;
  return (
    <>
      <Header
        shown={shownHosts}
        total={totalHosts}
        filtering={query.trim().length > 0}
        onLock={onLock}
      />
      <HostFilter query={query} setQuery={setQuery} onClear={clearFilter} disabled={empty} />
      {empty ? (
        <PairTerminal promoted />
      ) : (
        <>
          <HostList
            sections={sections}
            listRef={listRef}
            totalHosts={totalHosts}
            query={query}
            onClearFilter={clearFilter}
          />
          {unreadableProjects > 0 ? <UnreadableNote count={unreadableProjects} /> : null}
          <PairTerminal />
        </>
      )}
    </>
  );
}

// Projects whose hosts exist but this device cannot decrypt. Named here so the
// list is never quietly incomplete; the fix itself lives on /projects.
function UnreadableNote({ count }: { readonly count: number }) {
  const { t } = useTranslation();
  return (
    <p
      data-testid="connections-unreadable-projects"
      className="border-t border-border-subtle px-6 py-2.5 text-[12px] text-warn"
    >
      {t("connections.unreadableProjects", { count })}
    </p>
  );
}

interface ListHintProps {
  readonly shown: number;
  readonly total: number;
  readonly overflowing: boolean;
}

// The line under the card. It only ever states what is actually true: the
// "scroll for more" half appears only when the list really overflows, and the
// whole hint is dropped when everything is on screen.
function ListHint({ shown, total, overflowing }: ListHintProps) {
  const { t } = useTranslation();
  if (!overflowing && shown === total) return null;
  return (
    <p
      data-testid="connections-list-hint"
      className="mx-auto mt-3 w-full text-right text-[12px] text-faint"
      style={{ maxWidth: CARD_WIDTH }}
    >
      {overflowing
        ? t("connections.listHintScroll", { shown: String(shown), total: String(total) })
        : t("connections.listHint", { shown: String(shown), total: String(total) })}
    </p>
  );
}

interface HeaderProps {
  readonly shown: number;
  readonly total: number;
  readonly filtering: boolean;
  readonly onLock: () => void;
}

// Title, a count chip that narrows to "shown / total" while filtering, and the
// control that seals the vault again.
function Header({ shown, total, filtering, onLock }: HeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-[26px] pb-[18px]">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[19px] font-bold text-text">{t("connections.title")}</h2>
        <span
          data-testid="connections-count"
          // The chip is a bare number by design; the spelled-out count stays
          // reachable as its title rather than being dropped altogether.
          title={t("connections.count", { count: total })}
          className={cn(
            "border border-border px-[7px] py-px text-[12px]",
            total === 0 ? "text-dim" : "text-muted",
          )}
        >
          {filtering
            ? t("connections.countFiltered", { shown: String(shown), total: String(total) })
            : String(total)}
        </span>
      </div>
      <button
        type="button"
        onClick={onLock}
        data-testid="connections-lock"
        className="flex shrink-0 items-center gap-[7px] border border-border px-[11px] py-1.5 text-[12.5px] text-subtle hover:border-accent hover:text-text"
      >
        <LockOpen size={14} aria-hidden className="text-muted" />
        {"[ "}
        {t("connections.lock")}
        {" ]"}
      </button>
    </div>
  );
}
