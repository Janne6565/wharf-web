import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { hostTarget, type VaultHost } from "@/lib/vaultDocument";
import { DangerZone } from "./DangerZone";
import { useConnectionsLogic } from "./useConnectionsLogic";

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
    hosts,
    totalHosts,
    query,
    setQuery,
    handleLock,
  } = useConnectionsLogic();

  return (
    <AuthShell backTo="/">
      <Card label={t("cards.connections")} maxWidth={640}>
        <Header count={totalHosts} unlocked={vaultUnlocked} onLock={handleLock} />
        {vaultUnlocked || noVault ? (
          <VaultBody hosts={hosts} totalHosts={totalHosts} query={query} setQuery={setQuery} />
        ) : (
          <LockedPanel
            form={form}
            onSubmit={onSubmit}
            error={unlockError}
            loading={isUnlocking}
            canSubmit={canSubmit}
          />
        )}
        <Footer />
        <DangerZone />
      </Card>
    </AuthShell>
  );
}

interface HeaderProps {
  readonly count: number;
  readonly unlocked: boolean;
  readonly onLock: () => void;
}

function Header({ count, unlocked, onLock }: HeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[20px] font-bold text-text">{t("connections.title")}</h2>
        {unlocked ? (
          <span className="text-[12.5px] text-dim">{t("connections.count", { count })}</span>
        ) : null}
      </div>
      {unlocked ? (
        <button
          type="button"
          onClick={onLock}
          data-testid="connections-lock"
          className="text-[12.5px] text-dim hover:text-accent"
        >
          [ {t("connections.lock")} ]
        </button>
      ) : null}
    </div>
  );
}

interface VaultBodyProps {
  readonly hosts: readonly VaultHost[];
  readonly totalHosts: number;
  readonly query: string;
  readonly setQuery: (value: string) => void;
}

function VaultBody({ hosts, totalHosts, query, setQuery }: VaultBodyProps) {
  const { t } = useTranslation();
  if (totalHosts === 0) return <EmptyState />;
  return (
    <div>
      <FormField
        label={t("connections.filter")}
        data-testid="connections-filter"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {hosts.length === 0 ? (
        <p className="mt-6 text-center text-[13px] text-dim">{t("connections.noMatches")}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {hosts.map((host) => (
            <HostRow key={host.id} host={host} />
          ))}
        </div>
      )}
    </div>
  );
}

function authMarker(host: VaultHost): "key" | "password" | null {
  if (host.authMethod === "password") return "password";
  if (host.authMethod === "key" || host.keyPath) return "key";
  return null;
}

function HostRow({ host }: { readonly host: VaultHost }) {
  const { t } = useTranslation();
  const marker = authMarker(host);
  return (
    <div className="border border-border bg-input px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] text-text">{host.name}</span>
        {marker ? (
          <span className="text-[11.5px] text-dim">
            {marker === "key" ? t("connections.authKey") : t("connections.authPassword")}
          </span>
        ) : null}
      </div>
      <div className="break-all text-[12.5px] text-dim">{hostTarget(host)}</div>
      {host.tags && host.tags.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {host.tags.map((tag) => (
            <span key={tag} className="text-[11.5px] text-blue">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="py-6 text-center">
      <p className="text-[13px] text-muted">{t("connections.empty")}</p>
      <Link
        to="/device"
        search={{ onboarding: false }}
        className="mt-3 inline-block text-[13px] text-accent hover:text-accent-strong"
      >
        {t("connections.pairTerminal")}
      </Link>
    </div>
  );
}

interface LockedPanelProps {
  readonly form: ReturnType<typeof useConnectionsLogic>["form"];
  readonly onSubmit: ReturnType<typeof useConnectionsLogic>["onSubmit"];
  readonly error: string | null;
  readonly loading: boolean;
  readonly canSubmit: boolean;
}

function LockedPanel({ form, onSubmit, error, loading, canSubmit }: LockedPanelProps) {
  const { t } = useTranslation();
  const { register, formState } = form;
  return (
    <div>
      <p className="mb-6 text-[13px] leading-relaxed text-muted">{t("connections.lockedHint")}</p>
      <form onSubmit={onSubmit} noValidate>
        <FormField
          label={t("fields.masterPassword")}
          type="password"
          autoComplete="current-password"
          data-testid="connections-password"
          error={formState.errors.password?.message}
          {...register("password")}
        />
        {error ? <p className="mt-4 text-[13px] text-danger">{error}</p> : null}
        <Button
          type="submit"
          loading={loading}
          disabled={!canSubmit}
          data-testid="connections-unlock"
          className="mt-6"
        >
          {t("connections.unlock")}
        </Button>
      </form>
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <p className="mt-5 border-t border-border pt-3.5 text-center text-[12.5px] text-dim">
      <Link
        to="/device"
        search={{ onboarding: false }}
        className="text-accent hover:text-accent-strong"
      >
        {t("connections.pairTerminal")}
      </Link>
    </p>
  );
}
