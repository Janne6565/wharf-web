import { describe, expect, it } from "vitest";
import { EMPTY_PROJECT_DOCUMENT, emptyProjectPayload, parseProjectHosts } from "./projectDoc";

const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

describe("project document", () => {
  it("serializes the canonical empty document TUI-parity shape", () => {
    const json = new TextDecoder().decode(emptyProjectPayload());
    // Byte-exact key order matters for cross-client fingerprint parity.
    expect(json).toBe('{"schema":1,"hosts":[]}');
    expect(EMPTY_PROJECT_DOCUMENT).toEqual({ schema: 1, hosts: [] });
  });

  it("tolerates a null hosts array from an empty TUI document", () => {
    expect(parseProjectHosts(encode({ schema: 1, hosts: null }))).toEqual([]);
  });

  it("reads hosts and strips any stored password", () => {
    const hosts = parseProjectHosts(
      encode({
        schema: 1,
        hosts: [
          { id: "h1", name: "api", user: "deploy", addr: "10.0.0.1", port: 22, password: "s3cret" },
        ],
      }),
    );
    expect(hosts).toHaveLength(1);
    expect(hosts[0].name).toBe("api");
    expect(JSON.stringify(hosts[0])).not.toContain("s3cret");
  });
});
