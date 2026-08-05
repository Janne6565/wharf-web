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
import { isHybridPub, toBase64 } from "@/crypto";
import {
  ensureIdentity,
  identityKeys,
  republishLocalKey,
  resetIdentity,
  withIdentity,
} from "./identity";

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

// Real 32-byte X25519 halves: the identity encoding is length-checked, so the
// fixture has to be a well-formed key rather than a token string.
const X_PUB = new Uint8Array(32).fill(0x11);
const X_PRIV = new Uint8Array(32).fill(0x22);
const SEED = new Uint8Array(64).fill(0x33);

// A classical (pre-hybrid) identity: no mlkemSeed.
const IDENTITY = {
  x25519Priv: toBase64(X_PRIV),
  x25519Pub: toBase64(X_PUB),
  createdAt: "2026-01-01T00:00:00Z",
};
// The same identity after the hybrid upgrade.
const HYBRID_IDENTITY = { ...IDENTITY, mlkemSeed: toBase64(SEED) };

// What each identity publishes: the encoded key, not the bare x25519Pub field.
const publishedKey = (identity: typeof IDENTITY | typeof HYBRID_IDENTITY) =>
  toBase64(identityKeys(identity).publicKey);

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
  it("returns the existing identity and does not re-publish an already-hybrid key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: publishedKey(HYBRID_IDENTITY) });
    const result = await ensureIdentity(
      vaultOf({ schema: 4, hosts: [], identity: HYBRID_IDENTITY }),
    );
    expect(result).toEqual({ kind: "ready", identity: HYBRID_IDENTITY });
    expect(mocks.updatePublicKey).not.toHaveBeenCalled();
  });

  it("publishes an existing identity when the server lacks a key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: null });
    mocks.updatePublicKey.mockResolvedValue(undefined);
    const result = await ensureIdentity(
      vaultOf({ schema: 4, hosts: [], identity: HYBRID_IDENTITY }),
    );
    expect(result.kind).toBe("ready");
    expect(mocks.updatePublicKey).toHaveBeenCalledWith({
      publicKey: publishedKey(HYBRID_IDENTITY),
      rotate: false,
    });
    expect(mocks.updateVault).not.toHaveBeenCalled();
  });

  // The v1 -> v2 migration: a classical identity grows its ML-KEM half once the
  // published key is confirmed to be ours, and the hybrid key replaces it with
  // upgrade (not rotate), so no wrapped DEK is discarded.
  it("upgrades a classical identity to hybrid and publishes it with upgrade", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: publishedKey(IDENTITY) });
    mocks.getVault.mockResolvedValue({ version: 3 });
    mocks.updateVault.mockResolvedValue({ version: 4 });
    mocks.updatePublicKey.mockResolvedValue(undefined);

    const result = await ensureIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));

    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") throw new Error("unreachable");
    expect(result.identity.mlkemSeed).toBeTruthy();
    // The X25519 half is untouched — that is what keeps existing DEKs openable.
    expect(result.identity.x25519Pub).toBe(IDENTITY.x25519Pub);
    expect(result.identity.x25519Priv).toBe(IDENTITY.x25519Priv);

    const call = mocks.updatePublicKey.mock.calls[0][0];
    expect(call.rotate).toBe(false);
    expect(call.upgrade).toBe(true);
    expect(isHybridPub(identityKeys(result.identity).publicKey)).toBe(true);
    // The seed is persisted so the other clients pick it up.
    expect(mocks.updateVault).toHaveBeenCalledTimes(1);
  });

  it("keeps the classical identity working when the upgrade cannot be persisted", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: publishedKey(IDENTITY) });
    mocks.getVault.mockRejectedValue(new Error("offline"));

    const result = await ensureIdentity(vaultOf({ schema: 2, hosts: [], identity: IDENTITY }));

    expect(result).toEqual({ kind: "ready", identity: IDENTITY });
  });

  it("reports key-mismatch with both fingerprints when the server publishes a different key", async () => {
    mocks.getCurrentUser.mockResolvedValue({ publicKey: "c2VydmVyLWtleQ==" });

    const result = await ensureIdentity(
      vaultOf({ schema: 4, hosts: [], identity: HYBRID_IDENTITY }),
    );

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
    mocks.getCurrentUser.mockResolvedValue({ publicKey: publishedKey(HYBRID_IDENTITY) });
    const result = await ensureIdentity(
      vaultOf({ schema: 4, hosts: [], identity: HYBRID_IDENTITY }),
    );
    expect(result).toEqual({ kind: "ready", identity: HYBRID_IDENTITY });
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

    const identity = await republishLocalKey(
      vaultOf({ schema: 4, hosts: [], identity: HYBRID_IDENTITY }),
    );

    expect(identity).toEqual(HYBRID_IDENTITY);
    expect(mocks.updatePublicKey).toHaveBeenCalledWith({
      publicKey: publishedKey(HYBRID_IDENTITY),
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

    // A brand-new keypair — never the old server key or an existing vault
    // identity — and hybrid from birth.
    expect(identity.x25519Pub).toBeTruthy();
    expect(identity.x25519Priv).toBeTruthy();
    expect(identity.mlkemSeed).toBeTruthy();
    expect(mocks.updateVault).toHaveBeenCalledTimes(1);
    expect(mocks.updateVault.mock.calls[0][0].expectedVersion).toBe(4);
    expect(mocks.setVaultSession).toHaveBeenCalledTimes(1);
    // The publish is a deliberate rotate (nulls all wrapped DEKs server-side).
    expect(mocks.updatePublicKey).toHaveBeenCalledTimes(1);
    expect(mocks.updatePublicKey).toHaveBeenCalledWith({
      publicKey: publishedKey(identity),
      rotate: true,
    });
  });

  it("retries the vault write once on a concurrent-write conflict", async () => {
    mocks.getVault.mockResolvedValue({ version: 9 });
    mocks.updateVault
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 409 } })
      .mockResolvedValueOnce({ version: 10 });
    mocks.updatePublicKey.mockResolvedValue(undefined);

    await resetIdentity(vaultOf({ schema: 4, hosts: [], identity: HYBRID_IDENTITY }));

    expect(mocks.updateVault).toHaveBeenCalledTimes(2);
    expect(mocks.updatePublicKey).toHaveBeenCalledTimes(1);
  });
});
