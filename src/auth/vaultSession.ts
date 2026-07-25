// In-memory holder for the unlocked vault (DEK + decrypted payload) of the
// current session. It is NEVER persisted or serialized — it exists only so a
// signed-in session keeps the vault "primed" in memory after unlock, exactly
// like the Go TUI holds the DEK for its process lifetime.

import type { UnlockedVault } from "@/crypto";

let current: UnlockedVault | null = null;

// How many hosts the vault held when it was last open in THIS page session. A
// plain integer — never a host, never a secret, never persisted — kept so the
// locked screen can still say "12 hosts · encrypted on this device" after the
// user locks a vault they had open. It does not survive a reload: on a cold
// load the count is genuinely unknowable until the vault is decrypted.
let lastHostCount: number | null = null;

export function setVaultSession(vault: UnlockedVault): void {
  current = vault;
}

export function getVaultSession(): UnlockedVault | null {
  return current;
}

export function clearVaultSession(): void {
  current = null;
}

export function rememberHostCount(count: number): void {
  lastHostCount = count;
}

export function getRememberedHostCount(): number | null {
  return lastHostCount;
}

// Dropped on sign-out and account deletion (clearSession) — but deliberately
// NOT on lock, which is the whole point of remembering it.
export function forgetHostCount(): void {
  lastHostCount = null;
}
