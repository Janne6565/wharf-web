// Framework-agnostic parsing of the decrypted vault payload. The payload is the
// UTF-8 JSON document written by the Go TUI (the source of truth): a schema
// version, the stored hosts, and free-form settings. We deliberately map each
// raw host onto a typed VaultHost that OMITS the `password` field, so a stored
// password can never leak into the UI simply by rendering a host object.
//
// Document schema versions:
//   1 — hosts + settings only (the shape the Go TUI writes today).
//   2 — schema 1 plus an optional `identity`: the owner's X25519 keypair used to
//       wrap/unwrap Wharf Projects DEKs (crypto_box seal). The private key lives
//       ONLY inside this encrypted payload. A schema-1 document is a valid
//       schema-2 document with `identity` absent, so parsing accepts both and
//       never rejects on version.
//   3 — schema 2 plus an optional `keys[]` array of stored SSH keyfiles. We do
//       NOT map those onto a type: only their number is surfaced (see
//       keyCount below).
//   4 — schema 3 plus an optional `identity.mlkemSeed`: the ML-KEM-768 half that
//       makes project-DEK wrapping post-quantum. Absent means a classical
//       identity, which still works, so parsing again never rejects on version.

// A stored SSH connection. Mirrors the Go host shape minus `password`, which is
// intentionally absent from the type so it is never carried into the UI.
export interface VaultHost {
  readonly id: string;
  readonly name: string;
  readonly user: string;
  readonly addr: string;
  readonly port: number;
  readonly tags?: readonly string[];
  readonly keyPath?: string;
  readonly authMethod?: "key" | "password" | "";
  readonly source?: "manual" | "ssh_config";
  readonly lastSeen?: string;
}

// The owner's identity for Wharf Projects. Introduced in schema 2 and optional:
// absent on schema-1 documents and on accounts that have not yet generated an
// identity. Both X25519 keys are base64-encoded 32 bytes; the private key never
// leaves the encrypted vault payload.
//
// mlkemSeed (schema 4) is the base64 64-byte seed of the ML-KEM-768 keypair that
// makes DEK wrapping post-quantum. It is stored alongside — never instead of —
// the X25519 keys: the hybrid public key embeds the same X25519 key, so adding a
// seed leaves every already-wrapped DEK openable.
export interface VaultIdentity {
  readonly x25519Priv: string;
  readonly x25519Pub: string;
  readonly mlkemSeed?: string;
  readonly createdAt: string;
}

export interface VaultDocument {
  readonly schema: number;
  readonly hosts: readonly VaultHost[];
  readonly identity?: VaultIdentity;
  // How many SSH keyfiles the schema-3 `keys[]` array holds, and how many hosts
  // carry a stored password. These exist ONLY so the account-deletion warning
  // can say what is destroyed. They are counts on purpose: the key material and
  // the password values are never mapped onto a type and must never gain a
  // value accessor here — the whole point of toHost() below is that a secret
  // cannot reach the UI by rendering a parsed document.
  readonly keyCount: number;
  readonly storedPasswordCount: number;
}

interface RawHost {
  id?: unknown;
  name?: unknown;
  user?: unknown;
  addr?: unknown;
  port?: unknown;
  tags?: unknown;
  keyPath?: unknown;
  authMethod?: unknown;
  source?: unknown;
  lastSeen?: unknown;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

// Map a raw JSON host onto a typed VaultHost, copying only the known fields.
// This is what keeps `password` (and any other unknown field) out of the UI.
function toHost(raw: RawHost): VaultHost {
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === "string")
    : undefined;
  const authMethod =
    raw.authMethod === "key" || raw.authMethod === "password" || raw.authMethod === ""
      ? raw.authMethod
      : undefined;
  const source = raw.source === "manual" || raw.source === "ssh_config" ? raw.source : undefined;
  return {
    id: str(raw.id),
    name: str(raw.name),
    user: str(raw.user),
    addr: str(raw.addr),
    port: typeof raw.port === "number" ? raw.port : 0,
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(raw.keyPath !== undefined ? { keyPath: optionalStr(raw.keyPath) } : {}),
    ...(authMethod !== undefined ? { authMethod } : {}),
    ...(source !== undefined ? { source } : {}),
    ...(raw.lastSeen !== undefined ? { lastSeen: optionalStr(raw.lastSeen) } : {}),
  };
}

// Map a raw JSON identity onto a typed VaultIdentity, or undefined if it is
// absent or structurally incomplete. All three fields must be strings.
function toIdentity(raw: unknown): VaultIdentity | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }
  const { x25519Priv, x25519Pub, mlkemSeed, createdAt } = raw as Record<string, unknown>;
  if (
    typeof x25519Priv !== "string" ||
    typeof x25519Pub !== "string" ||
    typeof createdAt !== "string"
  ) {
    return undefined;
  }
  return {
    x25519Priv,
    x25519Pub,
    createdAt,
    ...(typeof mlkemSeed === "string" && mlkemSeed !== "" ? { mlkemSeed } : {}),
  };
}

// How many raw hosts carry a non-empty stored password. Only the number is
// returned — the value itself is dropped by toHost() and never read again.
function countStoredPasswords(rawHosts: readonly unknown[]): number {
  return rawHosts.filter((host) => {
    const password = (host as { password?: unknown }).password;
    return typeof password === "string" && password.length > 0;
  }).length;
}

// Decode and parse the decrypted vault payload into a typed document. Tolerates
// a missing/absent `hosts` array (defaults to []) and a missing `identity`
// (schema-1 documents, or accounts without an identity yet).
export function parseVaultDocument(payload: Uint8Array): VaultDocument {
  const raw = JSON.parse(new TextDecoder().decode(payload)) as {
    schema?: unknown;
    hosts?: unknown;
    identity?: unknown;
    keys?: unknown;
  };
  const rawHosts = Array.isArray(raw.hosts) ? raw.hosts : [];
  const identity = toIdentity(raw.identity);
  return {
    schema: typeof raw.schema === "number" ? raw.schema : 1,
    hosts: rawHosts.map((h) => toHost(h as RawHost)),
    ...(identity ? { identity } : {}),
    keyCount: Array.isArray(raw.keys) ? raw.keys.length : 0,
    storedPasswordCount: countStoredPasswords(rawHosts),
  };
}

// Render a host as `user@addr:port`, omitting the `user@` prefix when there is
// no user and the `:port` suffix when the port is 0 or missing.
export function hostTarget(host: VaultHost): string {
  const userPart = host.user ? `${host.user}@` : "";
  const portPart = host.port ? `:${host.port}` : "";
  return `${userPart}${host.addr}${portPart}`;
}
