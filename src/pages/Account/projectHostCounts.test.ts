import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ loadProjectVault: vi.fn() }));

vi.mock("@/vault/projectVaultAccess", () => ({ loadProjectVault: mocks.loadProjectVault }));

import type { VaultIdentity } from "@/lib/vaultDocument";
import { loadProjectHostCounts } from "./projectHostCounts";

const IDENTITY: VaultIdentity = {
  x25519Priv: "priv",
  x25519Pub: "pub",
  createdAt: "2026-07-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadProjectHostCounts", () => {
  it("counts the hosts of every readable project", async () => {
    mocks.loadProjectVault.mockImplementation(async (id: string) => ({
      awaiting: false,
      hosts: id === "p1" ? [{}, {}, {}] : [{}],
    }));

    expect(await loadProjectHostCounts(["p1", "p2"], IDENTITY)).toEqual({ p1: 3, p2: 1 });
  });

  it("reports unknown — never zero — for a project this identity cannot open", async () => {
    mocks.loadProjectVault.mockResolvedValue({ awaiting: true, hosts: [] });

    expect(await loadProjectHostCounts(["p1"], IDENTITY)).toEqual({ p1: null });
  });

  it("reports unknown when the fetch or the decrypt throws, and never rejects", async () => {
    mocks.loadProjectVault.mockRejectedValue(new Error("network down"));

    await expect(loadProjectHostCounts(["p1", "p2"], IDENTITY)).resolves.toEqual({
      p1: null,
      p2: null,
    });
  });

  it("keeps a readable project's count when a sibling fails", async () => {
    mocks.loadProjectVault.mockImplementation(async (id: string) => {
      if (id === "p1") throw new Error("boom");
      return { awaiting: false, hosts: [{}, {}] };
    });

    expect(await loadProjectHostCounts(["p1", "p2"], IDENTITY)).toEqual({ p1: null, p2: 2 });
  });
});
