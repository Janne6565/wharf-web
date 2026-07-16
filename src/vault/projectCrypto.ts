// Client-side crypto flows for Wharf Projects. Every project owns one opaque
// WHARFP blob sealed under a random per-project DEK; the DEK is distributed by
// sealing it (crypto_box_seal) to each member's published X25519 public key. The
// server never sees a DEK or any plaintext — it only stores the ciphertext blob
// and the 80-byte wrapped DEKs.
//
// These functions are pure (no network, no React): they take keys and ciphertext
// in and return the payloads to POST, so the crypto is unit-tested in isolation.

import { fromBase64, openProject, randomBytes, sealDek, sealProject, toBase64 } from "@/crypto";
import { emptyProjectPayload } from "./projectDoc";

const PROJECT_DEK_LEN = 32;

// A recipient of a project DEK: their user id and their raw X25519 public key.
export interface KeyRecipient {
  readonly userId: string;
  readonly publicKey: Uint8Array;
}

// A member's copy of a DEK, ready to POST (base64, exactly 80 bytes wrapped).
export interface WrappedKey {
  readonly userId: string;
  readonly wrappedDek: string;
}

// buildCreateProject produces the two ciphertext fields for POST /projects: an
// empty project blob sealed under a fresh DEK, and that DEK sealed to the
// creating owner's own public key (so they can immediately open it back).
export async function buildCreateProject(
  ownerPublicKey: Uint8Array,
): Promise<{ vault: string; wrappedDek: string }> {
  const dek = randomBytes(PROJECT_DEK_LEN);
  const blob = await sealProject(dek, emptyProjectPayload());
  const wrapped = await sealDek(dek, ownerPublicKey);
  return { vault: toBase64(blob), wrappedDek: toBase64(wrapped) };
}

// wrapDekForRecipients seals a DEK to each recipient's public key, returning the
// base64 wrapped copies to submit (used by both rotation and pending-key
// finalization).
export async function wrapDekForRecipients(
  dek: Uint8Array,
  recipients: readonly KeyRecipient[],
): Promise<WrappedKey[]> {
  return Promise.all(
    recipients.map(async (r) => ({
      userId: r.userId,
      wrappedDek: toBase64(await sealDek(dek, r.publicKey)),
    })),
  );
}

// rekeyProject performs a full client-side DEK rotation: it opens the current
// blob with the current DEK, re-seals the identical payload under a freshly
// generated DEK, and wraps the new DEK for every remaining member. The result is
// the body of POST /projects/{id}/rotate. Members without a published key are
// simply omitted (they re-enter awaiting-key and are finalized once they
// publish). The plaintext hosts are preserved unchanged across the rotation.
export async function rekeyProject(
  currentBlob: Uint8Array,
  currentDek: Uint8Array,
  remaining: readonly KeyRecipient[],
): Promise<{ vault: string; wrappedKeys: WrappedKey[] }> {
  const payload = await openProject(currentDek, currentBlob);
  const newDek = randomBytes(PROJECT_DEK_LEN);
  const blob = await sealProject(newDek, payload);
  const wrappedKeys = await wrapDekForRecipients(newDek, remaining);
  return { vault: toBase64(blob), wrappedKeys };
}

// decodeRecipient turns an API member/pending-key (base64 public key) into a
// KeyRecipient, or null when the member has not published a key yet.
export function decodeRecipient(
  userId: string | undefined,
  publicKey: string | null | undefined,
): KeyRecipient | null {
  if (!userId || !publicKey) return null;
  return { userId, publicKey: fromBase64(publicKey) };
}
