// Stateless read of a project's vault: fetch the ciphertext blob plus the
// caller's current wrapped DEK, unwrap the DEK with the account's identity, and
// open the blob to its hosts. The wrapped DEK is delivered on every fetch, so we
// never cache a DEK — we unwrap fresh each time (surviving rotations
// transparently). A null wrapped DEK, or an unwrap that fails (our identity does
// not match the key the DEK was sealed to), means we are awaiting access.

import { getProjectVault } from "@/api/wharf";
import { fromBase64, openDek, openProject } from "@/crypto";
import type { VaultHost, VaultIdentity } from "@/lib/vaultDocument";
import { identityKeys } from "./identity";
import { parseProjectHosts } from "./projectDoc";

export interface DecryptedProjectVault {
  readonly awaiting: boolean;
  readonly hosts: readonly VaultHost[];
  readonly dek?: Uint8Array;
  readonly blob?: Uint8Array;
  readonly version?: number;
}

const AWAITING = (version?: number): DecryptedProjectVault => ({
  awaiting: true,
  hosts: [],
  version,
});

export async function loadProjectVault(
  id: string,
  identity: VaultIdentity,
): Promise<DecryptedProjectVault> {
  const resp = await getProjectVault(id);
  if (!resp.wrappedDek || !resp.vault) return AWAITING(resp.version);
  try {
    const { publicKey, privateKey } = identityKeys(identity);
    const dek = await openDek(fromBase64(resp.wrappedDek), publicKey, privateKey);
    const blob = fromBase64(resp.vault);
    const payload = await openProject(dek, blob);
    return { awaiting: false, hosts: parseProjectHosts(payload), dek, blob, version: resp.version };
  } catch {
    // The DEK was sealed to a key our current identity cannot open (e.g. the key
    // rotated on another device). Treat as awaiting access rather than erroring.
    return AWAITING(resp.version);
  }
}
