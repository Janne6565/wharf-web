import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { UnlockedVault } from "@/crypto";
import { republishLocalKey } from "@/vault/identity";

// Query keys shared with the projects hub and project-detail hooks; invalidating
// them after a republish re-runs the identity check (hopefully now "ready") and
// refetches the project list + open detail (all now awaiting-access).
const IDENTITY_KEY = ["projectIdentity"] as const;
const PROJECTS_KEY = ["projects"] as const;
const PROJECT_KEY = ["project"] as const;

// Owns the confirm/acknowledge state and the republish mutation for the
// key-mismatch warning. The action re-publishes the vault's OWN key over the
// server's copy (rotate: true) — it never mints a new keypair.
export function useKeyMismatchNoticeLogic(vault: UnlockedVault) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const close = () => {
    setConfirmOpen(false);
    setAcknowledged(false);
  };

  const republishMutation = useMutation({
    mutationFn: () => republishLocalKey(vault),
    onSuccess: () => {
      close();
      void qc.invalidateQueries({ queryKey: IDENTITY_KEY });
      void qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      void qc.invalidateQueries({ queryKey: PROJECT_KEY });
    },
  });

  return {
    confirmOpen,
    acknowledged,
    setAcknowledged,
    openConfirm: () => setConfirmOpen(true),
    closeConfirm: close,
    confirmRepublish: () => republishMutation.mutate(),
    // The confirm button stays dead until the consequence is acknowledged.
    canConfirm: acknowledged,
    republishing: republishMutation.isPending,
    republishError: republishMutation.isError,
  };
}
