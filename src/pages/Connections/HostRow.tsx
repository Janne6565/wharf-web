import { Asterisk, ChevronRight, Key } from "lucide-react";
import { useTranslation } from "react-i18next";
import { hostTarget, type VaultHost } from "@/lib/vaultDocument";

// How the host authenticates, or null when the vault does not say.
function authMarker(host: VaultHost): "key" | "password" | null {
  if (host.authMethod === "password") return "password";
  if (host.authMethod === "key" || host.keyPath) return "key";
  return null;
}

// One stored connection: how it authenticates, its name, its target and its
// tags. The trailing chevron is decorative for now — the web app has no
// host-detail screen yet — so the row is not a link and not focusable.
export function HostRow({ host }: { readonly host: VaultHost }) {
  const { t } = useTranslation();
  const marker = authMarker(host);
  const markerLabel =
    marker === "password"
      ? t("connections.authPassword")
      : marker === "key"
        ? t("connections.authKey")
        : undefined;
  return (
    <div className="flex items-center gap-[14px] border-b border-border-subtle px-6 py-[13px] last:border-b-0 hover:bg-code">
      {/* Left blank when the vault does not record an auth method — guessing
          one would state something the document does not say. */}
      <span className="w-[15px] shrink-0" title={markerLabel}>
        {marker === "password" ? <Asterisk size={15} aria-hidden className="text-muted" /> : null}
        {marker === "key" ? <Key size={15} aria-hidden className="text-accent" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] text-text">{host.name}</div>
        <div className="mt-0.5 break-all text-[12px] text-dim">{hostTarget(host)}</div>
      </div>
      {host.tags && host.tags.length > 0 ? (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 text-[12px] text-accent">
          {host.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      ) : null}
      <ChevronRight size={15} aria-hidden className="shrink-0 text-faint" />
    </div>
  );
}
