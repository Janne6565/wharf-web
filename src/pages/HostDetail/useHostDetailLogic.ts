import { useMemo } from "react";
import { useVaultUnlock } from "@/auth/useVaultUnlock";
import { parseVaultDocument, type VaultHost } from "@/lib/vaultDocument";
import { useProjectHosts } from "@/vault/useProjectHosts";

// Owns a single stored connection: the shared vault gate plus the lookup of one
// host. Read-only by design — hosts are written from the terminal, so there is
// no mutation here and nothing to sync back.
//
// A host id is only unique within its own vault, so a shared host is addressed
// by (projectId, hostId): with a project given we look only in that project's
// decrypted blob, otherwise only in the personal document.
export function useHostDetailLogic(hostId: string, projectId?: string) {
  const gate = useVaultUnlock();
  const projectHosts = useProjectHosts(projectId ? gate.vault : null);

  const group = projectId ? projectHosts.groups.find((g) => g.id === projectId) : undefined;

  const host: VaultHost | null = useMemo(() => {
    if (!gate.vault) return null;
    if (projectId) return group?.hosts.find((h) => h.id === hostId) ?? null;
    const document = parseVaultDocument(gate.vault.payload);
    return document.hosts.find((h) => h.id === hostId) ?? null;
  }, [gate.vault, hostId, projectId, group]);

  // The shared blob is fetched and decrypted after the gate opens; until it
  // lands, "not found" would be premature.
  const loading = projectId !== undefined && projectHosts.loading;

  return {
    gate,
    host,
    projectName: group?.name,
    loading,
    // Only meaningful once the vault is open and any shared blob has been
    // decrypted: a locked vault says nothing about whether the host exists.
    notFound: gate.vaultUnlocked && !loading && host === null,
  };
}
