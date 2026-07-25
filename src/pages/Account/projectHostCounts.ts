// How many hosts each owned project holds, for the deletion confirmation.
//
// The server cannot answer this — a project vault is ciphertext to it — so the
// client counts them the same way the projects screens read a project: fetch
// the blob plus the caller's wrapped DEK, unwrap the DEK with the identity
// private key from the personal vault, open the blob, count. That whole path is
// loadProjectVault(); nothing about the crypto is reimplemented here.
//
// Every failure mode resolves to `null` — "unknown" — never to 0. A project we
// cannot read is rendered with its name and member impact alone, because a
// wrong number on a destructive confirmation is worse than no number.

import type { VaultIdentity } from "@/lib/vaultDocument";
import { loadProjectVault } from "@/vault/projectVaultAccess";

// projectId -> host count, or null when it could not be determined.
export type ProjectHostCounts = Readonly<Record<string, number | null>>;

async function countOne(id: string, identity: VaultIdentity): Promise<number | null> {
  try {
    const vault = await loadProjectVault(id, identity);
    // "Awaiting access" means the DEK was never sealed to this identity, so the
    // hosts are unreadable here — unknown, not zero.
    return vault.awaiting ? null : vault.hosts.length;
  } catch {
    return null;
  }
}

// Counts every project in parallel. Resolves even if every single one fails:
// this is decoration on a destructive flow and must never become an error path.
export async function loadProjectHostCounts(
  ids: readonly string[],
  identity: VaultIdentity,
): Promise<ProjectHostCounts> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await countOne(id, identity)] as const),
  );
  return Object.fromEntries(entries);
}
