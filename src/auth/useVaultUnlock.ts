// Shared vault-unlock gate. Signed-in screens that read the decrypted vault
// (connections, projects) need the unlocked vault in memory; after a reload the
// memory-only DEK is gone, so the user re-enters their master password to
// decrypt the freshly pulled blob locally. This hook owns that gate so each page
// composes it rather than re-implementing the unlock flow.

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus } from "@/api/httpError";
import { getVault } from "@/api/wharf";
import { clearVaultSession, getVaultSession, setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { fromBase64, unlockWithPassword } from "@/crypto";

interface UnlockValues {
  password: string;
}

export interface VaultUnlockGate {
  readonly vault: UnlockedVault | null;
  readonly vaultUnlocked: boolean;
  readonly noVault: boolean;
  readonly form: ReturnType<typeof useForm<UnlockValues>>;
  readonly onSubmit: ReturnType<ReturnType<typeof useForm<UnlockValues>>["handleSubmit"]>;
  readonly unlockError: string | null;
  readonly isUnlocking: boolean;
  readonly canSubmit: boolean;
  readonly lock: () => void;
}

export function useVaultUnlock(): VaultUnlockGate {
  const { t } = useTranslation();
  const [vault, setVault] = useState<UnlockedVault | null>(() => getVaultSession());
  const [noVault, setNoVault] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({ password: z.string().min(1, t("validation.passwordRequired")) }),
    [t],
  );
  const form = useForm<UnlockValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (values: UnlockValues) => {
      const response = await getVault();
      if (!response.vault) {
        setNoVault(true);
        return;
      }
      const unlocked = await unlockWithPassword(fromBase64(response.vault), values.password);
      setVaultSession(unlocked);
      setVault(unlocked);
    },
    onError: (error: unknown) => {
      const status = getHttpStatus(error);
      if (status === 429) {
        setUnlockError(t("errors.rateLimited"));
      } else if (status === undefined) {
        setUnlockError(t("errors.vaultUnlock"));
      } else {
        setUnlockError(t("errors.generic"));
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setUnlockError(null);
    mutation.mutate(values);
  });

  const lock = useCallback(() => {
    clearVaultSession();
    setVault(null);
    setNoVault(false);
    setUnlockError(null);
    form.reset({ password: "" });
  }, [form]);

  const password = form.watch("password");

  return {
    vault,
    vaultUnlocked: vault !== null,
    noVault,
    form,
    onSubmit,
    unlockError,
    isUnlocking: mutation.isPending,
    canSubmit: password.length > 0,
    lock,
  };
}
