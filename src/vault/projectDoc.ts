// The project document is the plaintext sealed inside a project's WHARFP blob:
// a schema version and the shared hosts. It mirrors the TUI's ProjectDoc exactly
// so a blob written here opens identically on the terminal (cross-client
// fingerprint parity): the canonical JSON is {"schema":1,"hosts":[...]}.
//
// An empty document written by the TUI may arrive as {"schema":1,"hosts":null};
// parseVaultDocument already tolerates a null/absent hosts array (→ []), so we
// reuse it to read project hosts too. Its typed mapping also strips any stored
// `password`, keeping it out of the read-only host list.

import { parseVaultDocument, type VaultHost } from "@/lib/vaultDocument";

// The canonical empty project document — key order and shape match the TUI's
// store.ProjectDoc so freshly created projects are byte-identical across clients.
export const EMPTY_PROJECT_DOCUMENT = { schema: 1, hosts: [] } as const;

const encoder = new TextEncoder();

export function emptyProjectPayload(): Uint8Array {
  return encoder.encode(JSON.stringify(EMPTY_PROJECT_DOCUMENT));
}

// Parse the decrypted project payload into its hosts, tolerating hosts:null.
export function parseProjectHosts(payload: Uint8Array): readonly VaultHost[] {
  return parseVaultDocument(payload).hosts;
}
