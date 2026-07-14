// In-memory holder for the unlocked vault (DEK + decrypted payload) of the
// current session. It is NEVER persisted or serialized — it exists only so a
// signed-in session keeps the vault "primed" in memory after unlock, exactly
// like the Go TUI holds the DEK for its process lifetime.

import type { UnlockedVault } from "@/crypto";

let current: UnlockedVault | null = null;

export function setVaultSession(vault: UnlockedVault): void {
  current = vault;
}

export function getVaultSession(): UnlockedVault | null {
  return current;
}

export function clearVaultSession(): void {
  current = null;
}
