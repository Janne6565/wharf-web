// The admin/owner finalize pass of the accept-then-finalize invite flow. When a
// member accepts an invite they join with no wrapped DEK (awaiting-key); it is
// any admin/owner client that, on its next Projects load, seals the project DEK
// to each such member's published public key and submits it.
//
// This runs opportunistically and best-effort: every project and every member is
// isolated in a try/catch so one failure never blocks the rest, and a 409 (the
// vault rotated since we read it) is skipped silently — a later pass resolves it.
//
// One thing is NOT best-effort: the pass takes the whole IdentityStatus, not a
// bare VaultIdentity, and refuses to do anything at all unless that status is
// "ready". "ready" is the only outcome in which ensureIdentity has verified that
// the key the server publishes for us is really ours. If the server lied about
// our own key it can just as easily lie about every other member's, and this pass
// seals the project DEK to server-supplied public keys automatically and
// unattended — it would hand the plaintext project key straight to the attacker
// for every pending member. So the gate is structural: there is no way to invoke
// the pass without presenting proof that the identity was verified, and an
// unverified status short-circuits before a single request is made.

import type { ProjectSummary } from "@/api/generated/model";
import { getHttpStatus } from "@/api/httpError";
import { getPendingKeys, getProjectVault, submitMemberKey } from "@/api/wharf";
import { fromBase64, openDek, sealDek, toBase64 } from "@/crypto";
import type { VaultIdentity } from "@/lib/vaultDocument";
import { type IdentityStatus, identityKeys } from "./identity";

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
//
// Hard gate: anything other than a verified "ready" identity — a key-mismatch, a
// vault that still needs syncing — aborts the pass before any network call. See
// the file header for why sealing DEKs under an untrusted server is unsafe.
export async function runFinalizePass(
  status: IdentityStatus,
  summaries: readonly ProjectSummary[],
): Promise<void> {
  if (status.kind !== "ready") return;
  const identity = status.identity;
  for (const summary of summaries) {
    if (!summary.id || !canFinalize(summary)) continue;
    try {
      await finalizeProject(summary.id, identity);
    } catch {
      // Project-level failure (e.g. we lost access mid-pass) is isolated.
    }
  }
}
