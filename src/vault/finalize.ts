// The admin/owner finalize pass of the accept-then-finalize invite flow. When a
// member accepts an invite they join with no wrapped DEK (awaiting-key); it is
// any admin/owner client that, on its next Projects load, seals the project DEK
// to each such member's published public key and submits it.
//
// This runs opportunistically and best-effort: every project and every member is
// isolated in a try/catch so one failure never blocks the rest, and a 409 (the
// vault rotated since we read it) is skipped silently — a later pass resolves it.

import type { ProjectSummary } from "@/api/generated/model";
import { getHttpStatus } from "@/api/httpError";
import { getPendingKeys, getProjectVault, submitMemberKey } from "@/api/wharf";
import { fromBase64, openDek, sealDek, toBase64 } from "@/crypto";
import type { VaultIdentity } from "@/lib/vaultDocument";
import { identityKeys } from "./identity";

const CONFLICT = 409;

function canFinalize(summary: ProjectSummary): boolean {
  return summary.role === "ADMIN" || summary.role === "OWNER";
}

async function finalizeProject(id: string, identity: VaultIdentity): Promise<void> {
  const resp = await getProjectVault(id);
  // No wrapped DEK for us yet: we cannot open the project, so we cannot seal it
  // for anyone else. A later pass (once we are keyed) will pick this up.
  if (!resp.wrappedDek) return;
  const { publicKey, privateKey } = identityKeys(identity);
  const dek = await openDek(fromBase64(resp.wrappedDek), publicKey, privateKey);
  const pending = await getPendingKeys(id);
  for (const member of pending) {
    if (!member.userId || !member.publicKey) continue;
    const wrappedDek = toBase64(await sealDek(dek, fromBase64(member.publicKey)));
    try {
      await submitMemberKey(id, member.userId, { wrappedDek, vaultVersion: resp.version });
    } catch (error) {
      // 409 = the vault rotated since we read it; a stale DEK is refused. Skip
      // silently — the next finalize pass re-wraps against the current version.
      if (getHttpStatus(error) !== CONFLICT) {
        // Any other per-member failure is non-fatal to the rest of the pass.
      }
    }
  }
}

// runFinalizePass seals and submits the DEK for every pending member across the
// caller's admin/owner projects. Resolves once every project has been attempted.
export async function runFinalizePass(
  identity: VaultIdentity,
  summaries: readonly ProjectSummary[],
): Promise<void> {
  for (const summary of summaries) {
    if (!summary.id || !canFinalize(summary)) continue;
    try {
      await finalizeProject(summary.id, identity);
    } catch {
      // Project-level failure (e.g. we lost access mid-pass) is isolated.
    }
  }
}
