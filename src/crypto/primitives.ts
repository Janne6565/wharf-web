// Low-level cryptographic primitives. argon2id runs through hash-wasm (which,
// unlike libsodium.js, supports parallelism > 1 as the contract requires);
// SHA-256 and HKDF run through WebCrypto; XChaCha20-Poly1305 runs through
// libsodium-wrappers. All are browser-only concerns but also resolve under
// Node/Vitest for the test suite.

import { argon2id } from "hash-wasm";
import _sodium from "libsodium-wrappers";

const encoder = new TextEncoder();

export interface Argon2Params {
  readonly iterations: number;
  readonly memoryKiB: number;
  readonly parallelism: number;
}

// deriveArgon2id derives a 32-byte key. secret and salt are raw bytes so this
// matches Go's argon2.IDKey(secret, salt, ...) exactly.
export async function deriveArgon2id(
  secret: Uint8Array,
  salt: Uint8Array,
  params: Argon2Params,
): Promise<Uint8Array> {
  return argon2id({
    password: secret,
    salt,
    iterations: params.iterations,
    memorySize: params.memoryKiB,
    parallelism: params.parallelism,
    hashLength: 32,
    outputType: "binary",
  });
}

// WebCrypto's typings want a BufferSource whose backing store is an ArrayBuffer;
// TS widens Uint8Array's buffer to ArrayBufferLike (incl. SharedArrayBuffer), so
// a narrow cast at the boundary is required. Our arrays are always ArrayBuffer-
// backed at runtime.
function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", asBufferSource(data));
  return new Uint8Array(digest);
}

// hkdfSha256 uses an empty salt: the server never re-derives these keys (it
// bcrypt-hashes whatever it receives), so only intra-client determinism matters.
export async function hkdfSha256(ikm: Uint8Array, info: string, length = 32): Promise<Uint8Array> {
  const subtle = globalThis.crypto.subtle;
  const key = await subtle.importKey("raw", asBufferSource(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: asBufferSource(new Uint8Array(0)),
      info: asBufferSource(encoder.encode(info)),
    },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

let sodiumReady: Promise<typeof _sodium> | null = null;

async function sodium(): Promise<typeof _sodium> {
  if (!sodiumReady) {
    sodiumReady = _sodium.ready.then(() => _sodium);
  }
  return sodiumReady;
}

export async function xchachaSeal(
  key: Uint8Array,
  nonce: Uint8Array,
  plaintext: Uint8Array,
  aad: Uint8Array | null,
): Promise<Uint8Array> {
  const s = await sodium();
  return s.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, aad, null, nonce, key);
}

// xchachaOpen returns null on authentication failure (rather than throwing) so
// callers can map it to the appropriate wrong-secret / corrupt error.
export async function xchachaOpen(
  key: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
  aad: Uint8Array | null,
): Promise<Uint8Array | null> {
  const s = await sodium();
  try {
    return s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ciphertext, aad, nonce, key);
  } catch {
    return null;
  }
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}
