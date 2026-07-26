import { describe, expect, it } from "vitest";
import { fingerprintPublicKey } from "./fingerprint";

// These vectors are the cross-client contract: the mobile app and the TUI pin the
// exact same three. A change here means the encodings have diverged and users can
// no longer compare fingerprints across devices.
describe("fingerprintPublicKey", () => {
  it("matches the shared vector for 32 zero bytes", async () => {
    expect(await fingerprintPublicKey(new Uint8Array(32))).toBe("Zmh6 rfhi vXds j8GL");
  });

  it("matches the shared vector for 32 0x01 bytes", async () => {
    expect(await fingerprintPublicKey(new Uint8Array(32).fill(1))).toBe("cs1u hCLE B/tt CYaQ");
  });

  it("matches the shared vector for ascending bytes 0x00..0x1f", async () => {
    const bytes = Uint8Array.from({ length: 32 }, (_, i) => i);
    expect(await fingerprintPublicKey(bytes)).toBe("Yw3N KWbE M2aR ElRI");
  });

  it("renders 4 groups of 4 characters", async () => {
    const value = await fingerprintPublicKey(new Uint8Array(32));
    expect(value.split(" ")).toHaveLength(4);
    for (const group of value.split(" ")) expect(group).toHaveLength(4);
  });
});
