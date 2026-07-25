import { describe, expect, it } from "vitest";
import { hostTarget, parseVaultDocument, type VaultHost } from "./vaultDocument";

function encode(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

describe("parseVaultDocument", () => {
  it("parses a full document into typed hosts", () => {
    const doc = parseVaultDocument(
      encode({
        schema: 1,
        hosts: [
          {
            id: "h1",
            name: "prod",
            user: "deploy",
            addr: "10.0.0.1",
            port: 22,
            tags: ["web", "eu"],
            keyPath: "~/.ssh/id_ed25519",
            authMethod: "key",
            source: "manual",
            lastSeen: "2026-07-15T10:00:00Z",
          },
        ],
        settings: { theme: "dark" },
      }),
    );
    expect(doc.schema).toBe(1);
    expect(doc.hosts).toHaveLength(1);
    expect(doc.hosts[0]).toEqual<VaultHost>({
      id: "h1",
      name: "prod",
      user: "deploy",
      addr: "10.0.0.1",
      port: 22,
      tags: ["web", "eu"],
      keyPath: "~/.ssh/id_ed25519",
      authMethod: "key",
      source: "manual",
      lastSeen: "2026-07-15T10:00:00Z",
    });
  });

  it("defaults missing hosts to an empty array", () => {
    expect(parseVaultDocument(encode({ schema: 1 })).hosts).toEqual([]);
    expect(parseVaultDocument(encode({ schema: 1, settings: {} })).hosts).toEqual([]);
  });

  it("drops the password field entirely", () => {
    const doc = parseVaultDocument(
      encode({
        schema: 1,
        hosts: [
          {
            id: "h1",
            name: "secret",
            user: "root",
            addr: "1.2.3.4",
            port: 22,
            authMethod: "password",
            password: "hunter2",
          },
        ],
      }),
    );
    const host = doc.hosts[0] as VaultHost & { password?: string };
    expect(host.password).toBeUndefined();
    expect(JSON.stringify(doc)).not.toContain("hunter2");
  });
});

// The counts exist only so the account-deletion warning can say what is
// destroyed. These pin down that they stay counts: no key material and no
// password value may be reachable through the parsed document.
describe("parseVaultDocument counts", () => {
  const SCHEMA_3 = {
    schema: 3,
    hosts: [
      { id: "h1", name: "a", user: "root", addr: "1.1.1.1", port: 22, password: "hunter2" },
      { id: "h2", name: "b", user: "root", addr: "1.1.1.2", port: 22, password: "" },
      { id: "h3", name: "c", user: "root", addr: "1.1.1.3", port: 22 },
    ],
    keys: [
      { id: "k1", name: "laptop", type: "ED25519", material: "PRIVATE-KEY-BYTES" },
      { id: "k2", name: "yubikey", type: "ED25519", material: "OTHER-KEY-BYTES" },
    ],
  };

  it("counts stored ssh keys and stored passwords", () => {
    const doc = parseVaultDocument(encode(SCHEMA_3));
    expect(doc.keyCount).toBe(2);
    // The empty-string password does not count as a stored password.
    expect(doc.storedPasswordCount).toBe(1);
  });

  it("reports zero counts for a document without keys or passwords", () => {
    const doc = parseVaultDocument(encode({ schema: 1, hosts: [] }));
    expect(doc.keyCount).toBe(0);
    expect(doc.storedPasswordCount).toBe(0);
  });

  it("exposes no key material and no password value anywhere in the document", () => {
    const doc = parseVaultDocument(encode(SCHEMA_3));
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toContain("PRIVATE-KEY-BYTES");
    expect(serialized).not.toContain("OTHER-KEY-BYTES");
    expect(serialized).not.toContain("hunter2");
    // There is no `keys` accessor at all — only the number of them.
    expect((doc as unknown as { keys?: unknown }).keys).toBeUndefined();
  });
});

describe("hostTarget", () => {
  const base: VaultHost = { id: "h", name: "n", user: "", addr: "example.com", port: 0 };

  it("renders user@addr:port", () => {
    expect(hostTarget({ ...base, user: "ada", port: 2222 })).toBe("ada@example.com:2222");
  });

  it("omits user@ when user is empty", () => {
    expect(hostTarget({ ...base, port: 2222 })).toBe("example.com:2222");
  });

  it("omits :port when port is 0 or missing", () => {
    expect(hostTarget({ ...base, user: "ada" })).toBe("ada@example.com");
  });

  it("shows the default port 22 when present in the data", () => {
    expect(hostTarget({ ...base, user: "ada", port: 22 })).toBe("ada@example.com:22");
  });
});
