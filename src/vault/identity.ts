// Lazy X25519 identity bootstrap, run on first Projects use once the vault is
// unlocked. The identity keypair lives inside the personal vault payload (schema
// 2) so it syncs across devices and never touches the server; only the public
// half is published (PUT /users/me/public-key) so others can seal project DEKs
// to it.
//
// Four cases, mirroring the TUI:
//   * vault has an identity  → idempotently publish it if the server lacks one,
//     and — critically — verify that the key the server publishes FOR US is the
//     one in this vault. The server distributes the public keys everyone seals
//     project DEKs to; if it publishes a key of its own choosing for our account,
//     every DEK shared "with us" is sealed to whoever holds that key instead. A
//     divergence is reported as "key-mismatch" and must stop the client dead.
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
import {
  fingerprintPublicKey,
  fromBase64,
  generateKeypair,
  HEADER_LEN,
  sealPayload,
  toBase64,
} from "@/crypto";
import { parseVaultDocument, type VaultIdentity } from "@/lib/vaultDocument";

const CONFLICT = 409;

export type IdentityStatus =
  | { readonly kind: "ready"; readonly identity: VaultIdentity }
  | { readonly kind: "needs-sync" }
  | {
      readonly kind: "key-mismatch";
      readonly localFingerprint: string;
      readonly serverFingerprint: string;
    };

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

// makeIdentity mints a fresh X25519 identity keypair, base64-encoded for storage
// in the vault payload.
async function makeIdentity(): Promise<VaultIdentity> {
  const kp = await generateKeypair();
  return {
    x25519Priv: toBase64(kp.privateKey),
    x25519Pub: toBase64(kp.publicKey),
    createdAt: new Date().toISOString(),
  };
}

// storeIdentity writes an identity into the personal vault (optimistic version,
// single retry on a concurrent write) and primes the in-memory session with the
// new payload. It does NOT publish the public key — the caller decides whether to
// publish idempotently (generate) or rotate (reset).
async function storeIdentity(vault: UnlockedVault, identity: VaultIdentity): Promise<void> {
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
}

// generateAndStore mints a keypair, writes it into the personal vault, then
// publishes the public key idempotently.
async function generateAndStore(vault: UnlockedVault): Promise<VaultIdentity> {
  const identity = await makeIdentity();
  await storeIdentity(vault, identity);
  await publishKey(identity.x25519Pub);
  return identity;
}

// keyBytes decodes a base64 public key. A key the server sends that isn't even
// valid base64 is a mismatch by definition; we still want *something* stable to
// fingerprint and display, so fall back to the raw characters it sent.
function keyBytes(base64: string): Uint8Array {
  try {
    return fromBase64(base64);
  } catch {
    return encoder.encode(base64);
  }
}

function sameKey(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// compareToServer checks the key the server publishes for this account against
// the one this vault holds. Equal → ready. Different → key-mismatch, with both
// fingerprints so the user can compare them against another device.
async function compareToServer(
  identity: VaultIdentity,
  serverKey: string,
): Promise<IdentityStatus> {
  const local = keyBytes(identity.x25519Pub);
  const remote = keyBytes(serverKey);
  if (sameKey(local, remote)) return { kind: "ready", identity };
  return {
    kind: "key-mismatch",
    localFingerprint: await fingerprintPublicKey(local),
    serverFingerprint: await fingerprintPublicKey(remote),
  };
}

// ensureIdentity resolves the account's project identity for the given unlocked
// vault, performing whichever of the four cases applies. It only ever writes on
// the generate path; the publish path is idempotent.
export async function ensureIdentity(vault: UnlockedVault): Promise<IdentityStatus> {
  const doc = parseVaultDocument(vault.payload);
  const me = await getCurrentUser();
  const serverKey = me.publicKey ?? null;

  if (doc.identity) {
    if (!serverKey) {
      await publishKey(doc.identity.x25519Pub);
      return { kind: "ready", identity: doc.identity };
    }
    return compareToServer(doc.identity, serverKey);
  }
  if (serverKey) {
    // Server has a key but this vault carries no identity: sync the vault from
    // the device that created it rather than minting a divergent keypair.
    return { kind: "needs-sync" };
  }
  const identity = await generateAndStore(vault);
  return { kind: "ready", identity };
}

// resetIdentity is the "I lost my old vault" recovery for the needs-sync outcome:
// this device can't sync the identity from the device that created it, so mint a
// brand-new keypair, write it into the personal vault, then ROTATE the published
// public key. The rotate replaces the account's key AND nulls every wrapped
// project DEK server-side, so all the caller's projects re-enter awaiting-access
// until an admin re-grants (projects where the caller was the only keyed member
// become unrecoverable). Unlike the generate path, the publish is a deliberate
// replace — no 409 swallowing.
export async function resetIdentity(vault: UnlockedVault): Promise<VaultIdentity> {
  const identity = await makeIdentity();
  await storeIdentity(vault, identity);
  await updatePublicKey({ publicKey: identity.x25519Pub, rotate: true });
  return identity;
}

// republishLocalKey is the remediation for the key-mismatch outcome: the key in
// this vault is fine, it is the server's published copy that is wrong, so we
// re-publish OUR key over it. Deliberately NOT resetIdentity — minting a new
// keypair would throw away a perfectly good identity and every DEK already
// sealed to it.
//
// rotate: true is required because the server refuses to replace an existing key
// otherwise; as a side effect it nulls every wrapped project DEK the account
// holds, so all projects re-enter awaiting-access until an admin re-grants
// access. The caller must confirm that with the user first.
export async function republishLocalKey(vault: UnlockedVault): Promise<VaultIdentity> {
  const doc = parseVaultDocument(vault.payload);
  if (!doc.identity) throw new Error("no local identity to republish");
  await updatePublicKey({ publicKey: doc.identity.x25519Pub, rotate: true });
  return doc.identity;
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
