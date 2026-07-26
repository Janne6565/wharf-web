import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Project } from "@/api/generated/model";
import { getHttpStatus } from "@/api/httpError";
import {
  createInvite,
  deleteInvite,
  deleteProject,
  getCurrentUser,
  getProject,
  leaveProject,
  rotateProject,
  updateMemberRole,
  updateProject,
} from "@/api/wharf";
import { ME_QUERY_KEY } from "@/auth/profile";
import { useVaultUnlock } from "@/auth/useVaultUnlock";
import type { UnlockedVault } from "@/crypto";
import { canAdminister, isOwner } from "@/lib/projectRole";
import type { VaultIdentity } from "@/lib/vaultDocument";
import { ensureIdentity } from "@/vault/identity";
import { decodeRecipient, type KeyRecipient, rekeyProject } from "@/vault/projectCrypto";
import { type DecryptedProjectVault, loadProjectVault } from "@/vault/projectVaultAccess";

const NOT_FOUND = 404;
const CONFLICT = 409;

export type Role = "OWNER" | "ADMIN" | "MEMBER";
export type InviteErrorKind = "conflict" | "generic" | null;

// Owns the project-detail screen: the vault gate, identity bootstrap, project
// detail + decrypted host list, and every admin/owner mutation (metadata,
// invites, roles/transfer, member removal via full client-side rotation, leave,
// delete).
export function useProjectDetailLogic(projectId: string) {
  const gate = useVaultUnlock();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const detailKey = ["project", projectId] as const;
  const vaultKey = ["project", projectId, "vault"] as const;

  const identityQuery = useQuery({
    queryKey: ["projectIdentity"],
    queryFn: () => ensureIdentity(gate.vault as UnlockedVault),
    enabled: gate.vaultUnlocked,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const identity: VaultIdentity | null =
    identityQuery.data?.kind === "ready" ? identityQuery.data.identity : null;
  // The server publishes a different public key for this account than the one in
  // this vault — anything sealed "to us" may not be ours. Surfaced instead of the
  // project body (see index.tsx).
  const keyMismatch =
    identityQuery.data?.kind === "key-mismatch"
      ? {
          localFingerprint: identityQuery.data.localFingerprint,
          serverFingerprint: identityQuery.data.serverFingerprint,
        }
      : null;

  const meQuery = useQuery({ queryKey: ME_QUERY_KEY, queryFn: getCurrentUser });

  const projectQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => getProject(projectId),
    enabled: gate.vaultUnlocked,
    retry: false,
  });

  const vaultQuery = useQuery({
    queryKey: vaultKey,
    queryFn: () => loadProjectVault(projectId, identity as VaultIdentity),
    enabled: gate.vaultUnlocked && identity !== null,
    retry: false,
  });

  const project: Project | undefined = projectQuery.data;
  const role = project?.role;
  const myUserId = meQuery.data?.id;
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: detailKey });
    void qc.invalidateQueries({ queryKey: vaultKey });
  };

  const metaMutation = useMutation({
    mutationFn: (values: { name: string; description: string }) =>
      updateProject(projectId, {
        name: values.name.trim(),
        description: values.description.trim(),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: detailKey }),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => createInvite(projectId, { email: email.trim() }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: detailKey }),
  });
  const inviteError: InviteErrorKind = inviteMutation.isError
    ? getHttpStatus(inviteMutation.error) === CONFLICT
      ? "conflict"
      : "generic"
    : null;

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => deleteInvite(projectId, inviteId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: detailKey }),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: Role }) =>
      updateMemberRole(projectId, vars.userId, { role: vars.role }),
    onSuccess: () => {
      // A transfer changes the caller's own role, so refresh the profile too.
      void qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      performRemoval(projectId, userId, project, identity, vaultQuery.data),
    onSuccess: () => invalidate(),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveProject(projectId),
    onSuccess: () => void navigate({ to: "/projects" }),
  });
  const leaveIsOwnerBlocked = getHttpStatus(leaveMutation.error) === CONFLICT;

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => void navigate({ to: "/projects" }),
  });

  return {
    gate,
    identityState: identityQuery.isError
      ? "error"
      : identityQuery.data
        ? identityQuery.data.kind
        : "loading",
    keyMismatch,
    project,
    loading: projectQuery.isLoading,
    notFound: getHttpStatus(projectQuery.error) === NOT_FOUND,
    role,
    canAdmin: canAdminister(role),
    isOwner: isOwner(role),
    isYou: (userId: string | undefined) => userId !== undefined && userId === myUserId,
    vault: {
      awaiting: vaultQuery.data?.awaiting ?? false,
      hosts: vaultQuery.data?.hosts ?? [],
      loading: vaultQuery.isLoading,
      ready: vaultQuery.data !== undefined && !vaultQuery.data.awaiting,
    },
    updateMeta: (name: string, description: string) => metaMutation.mutate({ name, description }),
    metaSaving: metaMutation.isPending,
    metaError: metaMutation.isError,
    inviteMember: (email: string) => inviteMutation.mutate(email),
    inviteSaving: inviteMutation.isPending,
    inviteError,
    inviteDone: inviteMutation.isSuccess,
    resetInvite: () => inviteMutation.reset(),
    revokeInvite: (inviteId: string) => revokeMutation.mutate(inviteId),
    revokingId: revokeMutation.isPending ? revokeMutation.variables : undefined,
    changeRole: (userId: string, next: Role) => roleMutation.mutate({ userId, role: next }),
    roleSaving: roleMutation.isPending,
    roleTargetId: roleMutation.isPending ? roleMutation.variables?.userId : undefined,
    removeMember: (userId: string) => removeMutation.mutate(userId),
    removeSaving: removeMutation.isPending,
    removeTargetId: removeMutation.isPending ? removeMutation.variables : undefined,
    removeError: removeMutation.isError,
    leave: () => leaveMutation.mutate(),
    leaving: leaveMutation.isPending,
    leaveIsOwnerBlocked,
    deleteProject: () => deleteMutation.mutate(),
    deleting: deleteMutation.isPending,
  };
}

// performRemoval runs the full client-side DEK rotation that removes a member:
// re-key the project for everyone who remains, then submit it atomically. A 409
// (someone rotated first) triggers one fresh reload + retry.
async function performRemoval(
  projectId: string,
  userId: string,
  project: Project | undefined,
  identity: VaultIdentity | null,
  cached: DecryptedProjectVault | undefined,
): Promise<void> {
  if (!identity) throw new Error("identity-not-ready");
  const remaining = remainingRecipients(project, userId);

  const rotateWith = async (vault: DecryptedProjectVault): Promise<void> => {
    if (vault.awaiting || !vault.dek || !vault.blob) throw new Error("no-project-access");
    const { vault: newVault, wrappedKeys } = await rekeyProject(vault.blob, vault.dek, remaining);
    await rotateProject(projectId, {
      removeUserId: userId,
      vault: newVault,
      expectedVersion: vault.version,
      wrappedKeys,
    });
  };

  const current = cached && !cached.awaiting ? cached : await loadProjectVault(projectId, identity);
  try {
    await rotateWith(current);
  } catch (error) {
    if (getHttpStatus(error) !== CONFLICT) throw error;
    await rotateWith(await loadProjectVault(projectId, identity));
  }
}

function remainingRecipients(project: Project | undefined, removedUserId: string): KeyRecipient[] {
  return (project?.members ?? [])
    .filter((m) => m.userId && m.userId !== removedUserId)
    .map((m) => decodeRecipient(m.userId, m.publicKey))
    .filter((r): r is KeyRecipient => r !== null);
}
