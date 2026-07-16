import { useTranslation } from "react-i18next";
import { hostTarget, type VaultHost } from "@/lib/vaultDocument";

interface HostsCardProps {
  readonly hosts: readonly VaultHost[];
  readonly awaiting: boolean;
  readonly loading: boolean;
}

// The read-only shared host list decrypted from the project blob. When the caller
// holds no key yet (awaiting) it shows a placeholder instead of the hosts.
export function HostsCard({ hosts, awaiting, loading }: HostsCardProps) {
  const { t } = useTranslation();
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-bold tracking-wide text-dim uppercase">
        {t("projectDetail.hosts.heading")}
      </h3>
      <HostsBody hosts={hosts} awaiting={awaiting} loading={loading} />
    </section>
  );
}

function HostsBody({ hosts, awaiting, loading }: HostsCardProps) {
  const { t } = useTranslation();
  if (loading) {
    return <p className="py-4 text-center text-[13px] text-dim">{t("projectDetail.loading")}</p>;
  }
  if (awaiting) {
    return (
      <p className="border border-warn-border bg-warn-bg px-4 py-3 text-[12.5px] text-warn">
        {t("projectDetail.hosts.awaiting")}
      </p>
    );
  }
  if (hosts.length === 0) {
    return <p className="py-4 text-[13px] text-muted">{t("projectDetail.hosts.empty")}</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {hosts.map((host) => (
        <HostRow key={host.id} host={host} />
      ))}
    </div>
  );
}

function HostRow({ host }: { readonly host: VaultHost }) {
  return (
    <div className="flex items-center gap-3 border border-border bg-input px-4 py-3">
      <span className="h-2 w-2 flex-none rounded-full bg-success" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] text-text">{host.name}</div>
        <div className="truncate text-[12.5px] text-dim">{hostTarget(host)}</div>
        {host.tags && host.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {host.tags.map((tag) => (
              <span key={tag} className="text-[11.5px] text-blue">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
