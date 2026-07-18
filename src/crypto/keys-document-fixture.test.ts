import { describe, expect, it } from "vitest";
import fixture from "@/crypto/__fixtures__/keys-document-fixture.json";
import { parseVaultDocument } from "@/lib/vaultDocument";
import { withIdentity } from "@/vault/identity";

// Cross-language parity proof for the schema-3 synced-SSH-keys document. The
// fixture is the exact `store.Save` output from wharf-tui's Go source of truth
// (internal/store TestWriteKeysDocumentFixture). Web does not surface the Keys
// tab, but it MUST (a) tolerate a schema-3 document — hosts and identity parse,
// no throw — and (b) preserve the `keys` array byte-for-byte through its raw-JSON
// identity write, so a web client that writes an identity into a vault synced from
// a mobile/TUI device never strands the synced keys.
describe("byte-compat with wharf-tui Go schema-3 keys document", () => {
  const payload = new TextEncoder().encode(fixture.payloadUtf8);
  const NEW_IDENTITY = {
    x25519Priv: "cHJpdg==",
    x25519Pub: "cHVi",
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("parses a schema-3 document without throwing, hosts and identity intact", () => {
    const doc = parseVaultDocument(payload);
    expect(doc.schema).toBe(fixture.expect.schema);
    expect(doc.hosts).toHaveLength(1);
    expect(doc.hosts[0].name).toBe("prod-web-01");
    // The schema-2 identity still parses on a schema-3 document.
    expect(doc.identity?.x25519Pub).toBe("cHVibGljLWtleS0zMi1ieXRlcy1maXh0dXJlLXNlZWQhISEh");
  });

  it("preserves the `keys` array byte-for-byte through the raw-JSON identity write", () => {
    const before = JSON.parse(fixture.payloadUtf8) as { schema: number; keys: unknown[] };
    const after = JSON.parse(new TextDecoder().decode(withIdentity(payload, NEW_IDENTITY))) as {
      schema: number;
      keys: unknown[];
      identity: typeof NEW_IDENTITY;
    };
    // The identity write must not drop or mutate the synced keys, and must leave
    // the schema at 3 (Math.max(3, 2) === 3).
    expect(after.keys).toEqual(before.keys);
    expect(after.schema).toBe(3);
    expect(after.identity).toEqual(NEW_IDENTITY);
  });
});
