// Minimal JWT claim decoder. The identity (access) token is deliberately
// claim-rich (userId, email, …) so the frontend reads auth state without an
// extra round-trip (see AUTH.md). We only *read* claims here — the backend
// validates the signature; the browser never trusts an unverified token for
// anything but display.

export interface IdentityClaims {
  userId?: string;
  email?: string;
  exp?: number;
}

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  // Decode UTF-8 from the binary string.
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeIdentityToken(token: string): IdentityClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as IdentityClaims;
  } catch {
    return null;
  }
}
