import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getVault: vi.fn(),
  updateVault: vi.fn(),
  updatePublicKey: vi.fn(),
  setVaultSession: vi.fn(),
}));

vi.mock("@/api/wharf", () => ({
  getCurrentUser: mocks.getCurrentUser,
  getVault: mocks.getVault,
  updateVault: mocks.updateVault,
  updatePublicKey: mocks.updatePublicKey,
}));
vi.mock("@/auth/vaultSession", () => ({ setVaultSession: mocks.setVaultSession }));

import type { UnlockedVault } from "@/crypto";
import { ensureIdentity, republishLocalKey, resetIdentity, withIdentity } from "./identity";

const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
const decode = (bytes: Uint8Array) => JSON.parse(new TextDecoder().decode(bytes));

function vaultOf(doc: unknown): UnlockedVault {
  return {
    dek: new Uint8Array(32),
    payload: encode(doc),
    params: { iterations: 3, memoryKiB: 1024, parallelism: 1 },
    header: new Uint8Array(218),
  };
}

const IDENTITY = { x25519Priv: "cHJpdg==", x25519Pub: "cHVi", createdAt: "2026-01-01T00:00:00Z" };

afterEach(() => vi.clearAllMocks());

describe("withIdentity", () => {
  it("writes the identity and bumps schema to 2 without disturbing other fields", () => {
    const payload = encode({
      schema: 1,
      hosts: [{ id: "h1", name: "api", password: "s3cret" }],
      settings: { theme: "abyss", agent: true },
    });
    const result = decode(withIdentity(payload, IDENTITY));
    expect(result.schema).toBe(2);
    expect(result.identity).toEqual(IDENTITY);
    // Untouched fields — including a stored host password — survive verbatim.
    expect(result.hosts[0].password).toBe("s3cret");
    expect(result.settings).toEqual({ theme: "abyss", agent: true });
  });
});

describe("ensureIdentity", () => {
  it("returns the existing identity and does not publish when the server has a key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: IDENTITY.x25519Pub });
    const result = await ensureIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));
    expect(result).toEqual({ kind: "ready", identity: IDENTITY });
    expect(mocks.updatePublicKey).not.toHaveBeenCalled();
  });

  it("publishes an existing identity when the server lacks a key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: null });
    mocks.updatePublicKey.mockResolvedValue(undefined);
    const result = await ensureIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));
    expect(result.kind).toBe("ready");
    expect(mocks.updatePublicKey).toHaveBeenCalledWith({
      publicKey: IDENTITY.x25519Pub,
      rotate: false,
    });
    expect(mocks.updateVault).not.toHaveBeenCalled();
  });

  it("reports key-mismatch with both fingerprints when the server publishes a different key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: "c2VydmVyLWtleQ==" });

    const result = await ensureIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));

    expect(result.kind).toBe("key-mismatch");
    if (result.kind !== "key-mismatch") throw new Error("unreachable");
    // Both fingerprints are shown so the user can compare against another device.
    expect(result.localFingerprint).toMatch(/^\S{4} \S{4} \S{4} \S{4}$/);
    expect(result.serverFingerprint).toMatch(/^\S{4} \S{4} \S{4} \S{4}$/);
    expect(result.localFingerprint).not.toBe(result.serverFingerprint);
    // Detection never writes or republishes anything on its own.
    expect(mocks.updatePublicKey).not.toHaveBeenCalled();
    expect(mocks.updateVault).not.toHaveBeenCalled();
  });

  it("stays ready when the server key is byte-identical to the vault's", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: IDENTITY.x25519Pub });
    const result = await ensureIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));
    expect(result).toEqual({ kind: "ready", identity: IDENTITY });
  });

  it("reports needs-sync when the server has a key but this vault has no identity", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: "someServerKey" });
    const result = await ensureIdentity(vaultOf({ schema: 1, hosts: [] }));
    expect(result).toEqual({ kind: "needs-sync" });
    expect(mocks.updateVault).not.toHaveBeenCalled();
  });

  it("generates, writes the vault at the current version, and publishes when neither exists", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: null });
    mocks.getVault.mockResolvedValue({ version: 7 });
    mocks.updateVault.mockResolvedValue({ version: 8 });
    mocks.updatePublicKey.mockResolvedValue(undefined);

    const result = await ensureIdentity(vaultOf({ schema: 1, hosts: [] }));

    expect(result.kind).toBe("ready");
    expect(mocks.updateVault).toHaveBeenCalledTimes(1);
    expect(mocks.updateVault.mock.calls[0][0].expectedVersion).toBe(7);
    expect(mocks.setVaultSession).toHaveBeenCalledTimes(1);
    expect(mocks.updatePublicKey).toHaveBeenCalledTimes(1);
  });
});

describe("republishLocalKey", () => {
  it("re-publishes the vault's own key with rotate and never mints a new one", async () => {
    mocks.updatePublicKey.mockResolvedValue(undefined);

    const identity = await republishLocalKey(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));

    expect(identity).toEqual(IDENTITY);
    expect(mocks.updatePublicKey).toHaveBeenCalledWith({
      publicKey: IDENTITY.x25519Pub,
      rotate: true,
    });
    // The local keypair is fine — only the server's copy was wrong.
    expect(mocks.updateVault).not.toHaveBeenCalled();
    expect(mocks.setVaultSession).not.toHaveBeenCalled();
  });

  it("refuses when this vault carries no identity", async () => {
    await expect(republishLocalKey(vaultOf({ schema: 1, hosts: [] }))).rejects.toThrow();
    expect(mocks.updatePublicKey).not.toHaveBeenCalled();
  });
});

describe("resetIdentity", () => {
  it("mints a fresh keypair, writes the vault at the current version, and rotates the public key", async () => {
    mocks.getVault.mockResolvedValue({ version: 4 });
    mocks.updateVault.mockResolvedValue({ version: 5 });
    mocks.updatePublicKey.mockResolvedValue(undefined);

    const identity = await resetIdentity(vaultOf({ schema: 1, hosts: [] }));

    // A brand-new keypair — never the old server key or an existing vault identity.
    expect(identity.x25519Pub).toBeTruthy();
    expect(identity.x25519Priv).toBeTruthy();
    expect(mocks.updateVault).toHaveBeenCalledTimes(1);
    expect(mocks.updateVault.mock.calls[0][0].expectedVersion).toBe(4);
    expect(mocks.setVaultSession).toHaveBeenCalledTimes(1);
    // The publish is a deliberate rotate (nulls all wrapped DEKs server-side).
    expect(mocks.updatePublicKey).toHaveBeenCalledTimes(1);
    expect(mocks.updatePublicKey).toHaveBeenCalledWith({
      publicKey: identity.x25519Pub,
      rotate: true,
    });
  });

  it("retries the vault write once on a concurrent-write conflict", async () => {
    mocks.getVault.mockResolvedValue({ version: 9 });
    mocks.updateVault
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 409 } })
      .mockResolvedValueOnce({ version: 10 });
    mocks.updatePublicKey.mockResolvedValue(undefined);

    await resetIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));

    expect(mocks.updateVault).toHaveBeenCalledTimes(2);
    expect(mocks.updatePublicKey).toHaveBeenCalledTimes(1);
  });
});
