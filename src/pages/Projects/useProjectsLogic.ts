import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { MyInvite, ProjectSummary } from "@/api/generated/model";
import {
  acceptInvite,
  createProject,
  declineInvite,
  getMyInvites,
  listProjects,
} from "@/api/wharf";
import { useVaultUnlock } from "@/auth/useVaultUnlock";
import { fromBase64, type UnlockedVault } from "@/crypto";
import { runFinalizePass } from "@/vault/finalize";
import { ensureIdentity } from "@/vault/identity";
import { buildCreateProject } from "@/vault/projectCrypto";

export type IdentityState = "loading" | "ready" | "needs-sync" | "key-mismatch" | "error";

const IDENTITY_KEY = ["projectIdentity"] as const;
const PROJECTS_KEY = ["projects"] as const;
const INVITES_KEY = ["myInvites"] as const;

interface CreateValues {
  name: string;
  description: string;
}

// Owns the projects hub: the vault-unlock gate, the lazy identity bootstrap, the
// project + invite lists, project creation, invite accept/decline, and the
// admin/owner finalize pass (run once per list load, and again after an accept).
export function useProjectsLogic() {
  const gate = useVaultUnlock();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const identityQuery = useQuery({
    queryKey: IDENTITY_KEY,
    queryFn: () => ensureIdentity(gate.vault as UnlockedVault),
    enabled: gate.vaultUnlocked,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const listQuery = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: listProjects,
    enabled: gate.vaultUnlocked,
    retry: false,
  });

  const invitesQuery = useQuery({
    queryKey: INVITES_KEY,
    queryFn: getMyInvites,
    enabled: gate.vaultUnlocked,
    retry: false,
  });

  const identityState: IdentityState = identityQuery.isError
    ? "error"
    : identityQuery.data
      ? identityQuery.data.kind
      : "loading";
  const identityReady = identityQuery.data?.kind === "ready";
  const keyMismatch =
    identityQuery.data?.kind === "key-mismatch"
      ? {
          localFingerprint: identityQuery.data.localFingerprint,
          serverFingerprint: identityQuery.data.serverFingerprint,
        }
      : null;

  const form = useForm<CreateValues>({
    defaultValues: { name: "", description: "" },
    mode: "onSubmit",
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateValues) => {
      if (identityQuery.data?.kind !== "ready") throw new Error("identity-not-ready");
      const ownerPub = fromBase64(identityQuery.data.identity.x25519Pub);
      const { vault, wrappedDek } = await buildCreateProject(ownerPub);
      return createProject({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        vault,
        wrappedDek,
      });
    },
    onSuccess: () => {
      form.reset({ name: "", description: "" });
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });

  // The finalize pass runs at most once per list load; accepting an invite
  // re-arms it so a freshly joined admin/owner project is picked up.
  const finalizedRef = useRef(false);
  const armFinalize = useCallback(() => {
    finalizedRef.current = false;
  }, []);

  useEffect(() => {
    if (!identityReady || !listQuery.data || finalizedRef.current) return;
    const status = identityQuery.data;
    if (!status) return;
    finalizedRef.current = true;
    // The pass re-checks the status itself and refuses anything but "ready" —
    // this is only the early-out.
    void runFinalizePass(status, listQuery.data).then(() => {
      void qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    });
  }, [identityReady, listQuery.data, identityQuery.data, qc]);

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptInvite(id),
    onSuccess: () => {
      armFinalize();
      void qc.invalidateQueries({ queryKey: INVITES_KEY });
      void qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => declineInvite(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: INVITES_KEY }),
  });

  const onCreateSubmit = form.handleSubmit((values) => createMutation.mutate(values));
  const name = form.watch("name");

  const projects: readonly ProjectSummary[] = listQuery.data ?? [];
  const invites: readonly MyInvite[] = invitesQuery.data ?? [];

  return {
    gate,
    identityState,
    keyMismatch,
    projects,
    listLoading: listQuery.isLoading,
    listError: listQuery.isError,
    invites,
    createOpen,
    toggleCreate: () => setCreateOpen((v) => !v),
    form,
    onCreateSubmit,
    isCreating: createMutation.isPending,
    createError: createMutation.isError,
    canCreate: name.trim().length > 0 && identityReady,
    acceptInvite: (id: string) => acceptMutation.mutate(id),
    declineInvite: (id: string) => declineMutation.mutate(id),
    invitePendingId:
      acceptMutation.isPending || declineMutation.isPending
        ? (acceptMutation.variables ?? declineMutation.variables)
        : undefined,
  };
}
