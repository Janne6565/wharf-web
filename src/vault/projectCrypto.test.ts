import { describe, expect, it } from "vitest";
import { fromBase64, openDek, openProject, sealProject, toBase64 } from "@/crypto";
import fixture from "@/crypto/__fixtures__/project-fixture.json";
import { buildCreateProject, decodeRecipient, rekeyProject } from "./projectCrypto";

const pub = fromBase64(fixture.publicKeyBase64);
const priv = fromBase64(fixture.privateKeyBase64);
const dek = fromBase64(fixture.dekBase64);

describe("buildCreateProject", () => {
  it("produces an empty project blob and a DEK the owner can unwrap and open", async () => {
    const { vault, wrappedDek } = await buildCreateProject(pub);

    // The wrapped DEK is exactly 80 bytes (sealed box) and the owner can unwrap it.
    expect(fromBase64(wrappedDek)).toHaveLength(80);
    const ownerDek = await openDek(fromBase64(wrappedDek), pub, priv);
    const payload = await openProject(ownerDek, fromBase64(vault));
    expect(new TextDecoder().decode(payload)).toBe('{"schema":1,"hosts":[]}');
  });
});

describe("rekeyProject", () => {
  it("re-seals under a fresh DEK, preserving the payload and re-wrapping for members", async () => {
    const payloadText =
      '{"schema":1,"hosts":[{"id":"h1","name":"api","user":"x","addr":"1.1.1.1","port":22}]}';
    const currentBlob = await sealProject(dek, new TextEncoder().encode(payloadText));

    const { vault, wrappedKeys } = await rekeyProject(currentBlob, dek, [
      { userId: "u1", publicKey: pub },
    ]);

    expect(wrappedKeys).toHaveLength(1);
    expect(wrappedKeys[0].userId).toBe("u1");
    expect(fromBase64(wrappedKeys[0].wrappedDek)).toHaveLength(80);

    // The new DEK is genuinely fresh, opens the re-sealed blob, and the hosts are
    // unchanged across the rotation.
    const newDek = await openDek(fromBase64(wrappedKeys[0].wrappedDek), pub, priv);
    expect(toBase64(newDek)).not.toBe(toBase64(dek));
    const reopened = await openProject(newDek, fromBase64(vault));
    expect(new TextDecoder().decode(reopened)).toBe(payloadText);
  });

  it("omits members without a published key", async () => {
    const blob = await sealProject(dek, new TextEncoder().encode('{"schema":1,"hosts":[]}'));
    const { wrappedKeys } = await rekeyProject(blob, dek, [{ userId: "u1", publicKey: pub }]);
    expect(wrappedKeys.map((k) => k.userId)).toEqual(["u1"]);
  });
});

describe("decodeRecipient", () => {
  it("returns null when the user id or public key is missing", () => {
    expect(decodeRecipient(undefined, fixture.publicKeyBase64)).toBeNull();
    expect(decodeRecipient("u1", null)).toBeNull();
    expect(decodeRecipient("u1", undefined)).toBeNull();
  });

  it("decodes a base64 public key into raw bytes", () => {
    const recipient = decodeRecipient("u1", fixture.publicKeyBase64);
    expect(recipient?.userId).toBe("u1");
    expect(recipient?.publicKey).toHaveLength(32);
  });
});
