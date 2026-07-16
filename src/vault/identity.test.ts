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
import { ensureIdentity, withIdentity } from "./identity";

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
