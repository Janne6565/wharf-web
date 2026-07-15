// Framework-agnostic parsing of the decrypted vault payload. The payload is the
// UTF-8 JSON document written by the Go TUI (the source of truth): a schema
// version, the stored hosts, and free-form settings. We deliberately map each
// raw host onto a typed VaultHost that OMITS the `password` field, so a stored
// password can never leak into the UI simply by rendering a host object.

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

export interface VaultDocument {
  readonly schema: number;
  readonly hosts: readonly VaultHost[];
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

// Decode and parse the decrypted vault payload into a typed document. Tolerates
// a missing/absent `hosts` array (defaults to []).
export function parseVaultDocument(payload: Uint8Array): VaultDocument {
  const raw = JSON.parse(new TextDecoder().decode(payload)) as {
    schema?: unknown;
    hosts?: unknown;
  };
  const rawHosts = Array.isArray(raw.hosts) ? raw.hosts : [];
  return {
    schema: typeof raw.schema === "number" ? raw.schema : 1,
    hosts: rawHosts.map((h) => toHost(h as RawHost)),
  };
}

// Render a host as `user@addr:port`, omitting the `user@` prefix when there is
// no user and the `:port` suffix when the port is 0 or missing.
export function hostTarget(host: VaultHost): string {
  const userPart = host.user ? `${host.user}@` : "";
  const portPart = host.port ? `:${host.port}` : "";
  return `${userPart}${host.addr}${portPart}`;
}
