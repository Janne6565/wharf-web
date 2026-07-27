import { useMemo } from "react";
import { useVaultUnlock } from "@/auth/useVaultUnlock";
import { parseVaultDocument, type VaultHost } from "@/lib/vaultDocument";

// Owns a single stored connection: the shared vault gate plus the lookup of one
// host in the decrypted document. Read-only by design — hosts are written from
// the terminal, so there is no mutation here and nothing to sync back.
export function useHostDetailLogic(hostId: string) {
  const gate = useVaultUnlock();

  const host: VaultHost | null = useMemo(() => {
    if (!gate.vault) return null;
    const document = parseVaultDocument(gate.vault.payload);
    return document.hosts.find((h) => h.id === hostId) ?? null;
  }, [gate.vault, hostId]);

  return {
    gate,
    host,
    // Only meaningful once the vault is open: a locked vault says nothing about
    // whether the host exists.
    notFound: gate.vaultUnlocked && host === null,
  };
}
