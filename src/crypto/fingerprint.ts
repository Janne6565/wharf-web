// Human-comparable fingerprints of an X25519 public key.
//
// The whole point of a fingerprint is that a user can read it off one device and
// compare it against another, so the encoding is a cross-client contract shared
// verbatim by the web app, the mobile app and the TUI. Any change here is a
// breaking change for all four implementations:
//
//   SHA-256 over the raw 32 public-key bytes
//   → standard base64 of the digest, "=" padding stripped
//   → first 16 characters
//   → grouped into 4 blocks of 4, single-space separated
//
// e.g. 32 zero bytes → "Zmh6 rfhi vXds j8GL". The vectors are pinned in
// fingerprint.test.ts.

import { toBase64 } from "./base64";
import { sha256 } from "./primitives";

const FINGERPRINT_CHARS = 16;
const GROUP_SIZE = 4;

// groupFingerprint splits the truncated digest into fixed-size, space-separated
// blocks. Exported for tests; callers want fingerprintPublicKey.
export function groupFingerprint(value: string): string {
  const groups: string[] = [];
  for (let i = 0; i < value.length; i += GROUP_SIZE) {
    groups.push(value.slice(i, i + GROUP_SIZE));
  }
  return groups.join(" ");
}

// fingerprintPublicKey renders the display fingerprint of a raw 32-byte X25519
// public key.
export async function fingerprintPublicKey(publicKey: Uint8Array): Promise<string> {
  const digest = await sha256(publicKey);
  const base64 = toBase64(digest).replace(/=+$/, "");
  return groupFingerprint(base64.slice(0, FINGERPRINT_CHARS));
}
