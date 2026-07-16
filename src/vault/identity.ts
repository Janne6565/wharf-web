// Lazy X25519 identity bootstrap, run on first Projects use once the vault is
// unlocked. The identity keypair lives inside the personal vault payload (schema
// 2) so it syncs across devices and never touches the server; only the public
// half is published (PUT /users/me/public-key) so others can seal project DEKs
// to it.
//
// Three cases, mirroring the TUI:
//   * vault has an identity  → idempotently publish it if the server lacks one.
//   * no identity, server HAS a key → this vault is behind the device that
//     created the identity; we must NOT mint a second keypair (that would strand
//     every DEK wrapped to the real key). Report "needs-sync" so the UI can tell
//     the user to sync this vault first.
//   * neither → generate a keypair, write it into the vault (schema 2), PUT the
//     personal vault (optimistic version), then publish the public key.

import { getHttpStatus } from "@/api/httpError";
import { getCurrentUser, getVault, updatePublicKey, updateVault } from "@/api/wharf";
import { setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { fromBase64, generateKeypair, HEADER_LEN, sealPayload, toBase64 } from "@/crypto";
import { parseVaultDocument, type VaultIdentity } from "@/lib/vaultDocument";

const CONFLICT = 409;

export type IdentityStatus =
  | { readonly kind: "ready"; readonly identity: VaultIdentity }
  | { readonly kind: "needs-sync" };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// withIdentity writes an identity into a decrypted vault payload without
// disturbing any other field (hosts incl. their stored passwords, settings). It
// parses the raw JSON — deliberately NOT through the typed parser, which strips
// unknown fields — sets the identity and bumps schema to 2. Exported for tests.
export function withIdentity(payload: Uint8Array, identity: VaultIdentity): Uint8Array {
  const raw = JSON.parse(decoder.decode(payload)) as Record<string, unknown>;
  raw.identity = identity;
  const schema = typeof raw.schema === "number" ? raw.schema : 1;
  raw.schema = Math.max(schema, 2);
  return encoder.encode(JSON.stringify(raw));
}

// publishKey publishes the account's public key. A 409 means the server already
// holds a key (a race, or a prior publish); we treat it as already-published
// rather than an error, since the caller only wants the key to be present.
async function publishKey(publicKey: string): Promise<void> {
  try {
    await updatePublicKey({ publicKey, rotate: false });
  } catch (error) {
    if (getHttpStatus(error) === CONFLICT) return;
    throw error;
  }
}

// generateAndStore mints a keypair, writes it into the personal vault (optimistic
// version, single retry on a concurrent write), primes the in-memory session
// with the new payload, then publishes the public key.
async function generateAndStore(vault: UnlockedVault): Promise<VaultIdentity> {
  const kp = await generateKeypair();
  const identity: VaultIdentity = {
    x25519Priv: toBase64(kp.privateKey),
    x25519Pub: toBase64(kp.publicKey),
    createdAt: new Date().toISOString(),
  };
  const newPayload = withIdentity(vault.payload, identity);
  const blob = await sealPayload(vault, newPayload);
  const base64 = toBase64(blob);

  const write = async (): Promise<void> => {
    const current = await getVault();
    await updateVault({ vault: base64, expectedVersion: current.version });
  };
  try {
    await write();
  } catch (error) {
    if (getHttpStatus(error) !== CONFLICT) throw error;
    await write();
  }

  setVaultSession({ ...vault, payload: newPayload, header: blob.slice(0, HEADER_LEN) });
  await publishKey(identity.x25519Pub);
  return identity;
}

// ensureIdentity resolves the account's project identity for the given unlocked
// vault, performing whichever of the three cases applies. It only ever writes on
// the generate path; the publish path is idempotent.
export async function ensureIdentity(vault: UnlockedVault): Promise<IdentityStatus> {
  const doc = parseVaultDocument(vault.payload);
  const me = await getCurrentUser();
  const serverKey = me.publicKey ?? null;

  if (doc.identity) {
    if (!serverKey) await publishKey(doc.identity.x25519Pub);
    return { kind: "ready", identity: doc.identity };
  }
  if (serverKey) {
    // Server has a key but this vault carries no identity: sync the vault from
    // the device that created it rather than minting a divergent keypair.
    return { kind: "needs-sync" };
  }
  const identity = await generateAndStore(vault);
  return { kind: "ready", identity };
}

// identityKeys decodes a ready identity's base64 keypair into raw bytes for the
// sealed-box unwrap of project DEKs.
export function identityKeys(identity: VaultIdentity): {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  return {
    publicKey: fromBase64(identity.x25519Pub),
    privateKey: fromBase64(identity.x25519Priv),
  };
}
