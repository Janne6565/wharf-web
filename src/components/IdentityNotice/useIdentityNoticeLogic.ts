import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { UnlockedVault } from "@/crypto";
import { resetIdentity } from "@/vault/identity";

// Query keys shared with the projects hub and project-detail hooks; invalidating
// them after a reset re-runs the identity bootstrap (now "ready") and refetches
// the project list + open detail (all now awaiting-access).
const IDENTITY_KEY = ["projectIdentity"] as const;
const PROJECTS_KEY = ["projects"] as const;
const PROJECT_KEY = ["project"] as const;

// Owns the identity-reset confirm state and the rotate mutation for the
// needs-sync notice. Kept out of the JSX per the component/hook split.
export function useIdentityNoticeLogic(vault: UnlockedVault) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => resetIdentity(vault),
    onSuccess: () => {
      setConfirmOpen(false);
      void qc.invalidateQueries({ queryKey: IDENTITY_KEY });
      void qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      void qc.invalidateQueries({ queryKey: PROJECT_KEY });
    },
  });

  return {
    confirmOpen,
    openConfirm: () => setConfirmOpen(true),
    closeConfirm: () => setConfirmOpen(false),
    confirmReset: () => resetMutation.mutate(),
    resetting: resetMutation.isPending,
    resetError: resetMutation.isError,
  };
}
