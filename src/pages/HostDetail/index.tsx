import { Asterisk, Key, Terminal, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { LockedVaultPanel } from "@/components/LockedVaultPanel";
import { hostTarget, type VaultHost } from "@/lib/vaultDocument";
import { useHostDetailLogic } from "./useHostDetailLogic";

interface HostDetailPageProps {
  readonly hostId: string;
  // Present when the row came from a shared project section — host ids are only
  // unique inside one vault, so the origin has to travel with the id.
  readonly projectId?: string;
}

// One stored connection, read-only. Everything shown comes from the decrypted
// vault document, which by construction carries no secrets: parseVaultDocument
// drops stored passwords and key material, so nothing sensitive can reach this
// screen by rendering a host.
export function HostDetailPage({ hostId, projectId }: HostDetailPageProps) {
  const { t } = useTranslation();
  const { gate, host, projectName, loading, notFound } = useHostDetailLogic(hostId, projectId);

  return (
    <AuthShell backTo="/connections">
      <Card label={t("cards.host")} maxWidth={640}>
        {gate.vaultUnlocked ? (
          <Body host={host} projectName={projectName} loading={loading} notFound={notFound} />
        ) : (
          <LockedVaultPanel gate={gate} testIdPrefix="host" />
        )}
      </Card>
    </AuthShell>
  );
}

interface BodyProps {
  readonly host: VaultHost | null;
  readonly projectName: string | undefined;
  readonly loading: boolean;
  readonly notFound: boolean;
}

function Body({ host, projectName, loading, notFound }: BodyProps) {
  const { t } = useTranslation();
  // A shared host's blob is decrypted after the gate opens; saying "not found"
  // while that is still in flight would be wrong.
  if (loading && !host) {
    return <p className="py-4 text-center text-[13px] text-dim">{t("hostDetail.loading")}</p>;
  }
  if (notFound || !host) {
    return <Alert tone="danger">{t("hostDetail.notFound")}</Alert>;
  }
  return (
    <div className="flex flex-col gap-6">
      <HostHeader host={host} projectName={projectName} />
      <HostFacts host={host} />
      <TerminalHint name={host.name} />
    </div>
  );
}

function HostHeader({
  host,
  projectName,
}: {
  readonly host: VaultHost;
  readonly projectName: string | undefined;
}) {
  const key = host.authMethod === "key" || (host.authMethod !== "password" && host.keyPath);
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 shrink-0">
        {host.authMethod === "password" ? (
          <Asterisk size={17} aria-hidden className="text-muted" />
        ) : null}
        {key ? <Key size={17} aria-hidden className="text-accent" /> : null}
      </span>
      <div className="min-w-0">
        <h2 data-testid="host-name" className="text-[19px] font-bold text-text">
          {host.name}
        </h2>
        <p className="mt-1 break-all text-[13px] text-dim">{hostTarget(host)}</p>
        {/* A shared host is read from a project blob, not this account's vault —
            worth naming, since it is not the user's alone to change. */}
        {projectName ? (
          <p data-testid="host-project" className="mt-2 text-[12px] text-accent">
            <Users size={13} aria-hidden className="mr-1.5 inline align-[-2px]" />
            {projectName}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// The fact table. Rows for values the document does not carry are dropped
// rather than shown empty — an absent auth method means the vault does not say,
// not "none".
function HostFacts({ host }: { readonly host: VaultHost }) {
  const { t } = useTranslation();
  const auth =
    host.authMethod === "password"
      ? t("connections.authPassword")
      : host.authMethod === "key" || host.keyPath
        ? t("connections.authKey")
        : null;
  return (
    <dl className="flex flex-col gap-3 border-t border-border-subtle pt-5 text-[13px]">
      {auth ? <Fact label={t("hostDetail.auth")} value={auth} /> : null}
      {host.keyPath ? <Fact label={t("hostDetail.keyPath")} value={host.keyPath} /> : null}
      {host.user ? <Fact label={t("hostDetail.user")} value={host.user} /> : null}
      <Fact label={t("hostDetail.address")} value={host.addr} />
      {host.port ? <Fact label={t("hostDetail.port")} value={String(host.port)} /> : null}
      {host.tags && host.tags.length > 0 ? (
        <Fact label={t("hostDetail.tags")} value={host.tags.map((tag) => `#${tag}`).join(" ")} />
      ) : null}
      {host.source ? (
        <Fact
          label={t("hostDetail.source")}
          value={
            host.source === "ssh_config"
              ? t("hostDetail.sourceConfig")
              : t("hostDetail.sourceManual")
          }
        />
      ) : null}
    </dl>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <dt className="w-[104px] shrink-0 text-dim">{label}</dt>
      <dd className="min-w-0 break-all text-text">{value}</dd>
    </div>
  );
}

// The same contract the connections hub states: hosts are written from the
// terminal. Naming the exact keystroke keeps this from being a dead end.
function TerminalHint({ name }: { readonly name: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 border border-border bg-input px-4 py-3.5">
      <Terminal size={15} aria-hidden className="mt-0.5 shrink-0 text-dim" />
      <div className="min-w-0 text-[12.5px] leading-relaxed text-dim">
        <p>{t("hostDetail.editHint")}</p>
        <p className="mt-1.5 break-all text-muted">{t("hostDetail.editCommand", { name })}</p>
      </div>
    </div>
  );
}
