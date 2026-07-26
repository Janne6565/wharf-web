import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProjectVault: vi.fn(),
  getPendingKeys: vi.fn(),
  submitMemberKey: vi.fn(),
}));

vi.mock("@/api/wharf", () => ({
  getProjectVault: mocks.getProjectVault,
  getPendingKeys: mocks.getPendingKeys,
  submitMemberKey: mocks.submitMemberKey,
}));

import type { ProjectSummary } from "@/api/generated/model";
import { runFinalizePass } from "./finalize";
import type { IdentityStatus } from "./identity";

const IDENTITY = { x25519Priv: "cHJpdg==", x25519Pub: "cHVi", createdAt: "t" };
const PROJECTS: readonly ProjectSummary[] = [
  { id: "p1", name: "Atlas", role: "OWNER", memberCount: 2 } as ProjectSummary,
];

afterEach(() => vi.clearAllMocks());

describe("runFinalizePass", () => {
  // The security-critical case: a server that lies about our own public key can
  // lie about every member's, so the unattended sealing pass must not run at all.
  it("does nothing while the identity is key-mismatched", async () => {
    const status: IdentityStatus = {
      kind: "key-mismatch",
      localFingerprint: "aaaa aaaa aaaa aaaa",
      serverFingerprint: "bbbb bbbb bbbb bbbb",
    };

    await runFinalizePass(status, PROJECTS);

    expect(mocks.getProjectVault).not.toHaveBeenCalled();
    expect(mocks.getPendingKeys).not.toHaveBeenCalled();
    expect(mocks.submitMemberKey).not.toHaveBeenCalled();
  });

  it("does nothing while the identity still needs syncing", async () => {
    await runFinalizePass({ kind: "needs-sync" }, PROJECTS);
    expect(mocks.getProjectVault).not.toHaveBeenCalled();
  });

  it("reads the project vault for a verified identity", async () => {
    // No wrapped DEK for us yet, so the pass stops after the read — enough to
    // prove the "ready" status is not gated out.
    mocks.getProjectVault.mockResolvedValue({ wrappedDek: null, version: 1 });

    await runFinalizePass({ kind: "ready", identity: IDENTITY }, PROJECTS);

    expect(mocks.getProjectVault).toHaveBeenCalledWith("p1");
  });
});
