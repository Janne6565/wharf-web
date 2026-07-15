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
import { parseVaultDocument, type VaultHost } from "@/lib/vaultDocument";

interface UnlockValues {
  password: string;
}

function matchesQuery(host: VaultHost, needle: string): boolean {
  if (!needle) return true;
  const haystack = [host.name, host.user, host.addr, ...(host.tags ?? [])].join(" ").toLowerCase();
  return haystack.includes(needle);
}

// Owns the connections view: reads the in-memory vault (primed at sign-in), and
// — after a reload drops the memory-only DEK — re-unlocks it locally from the
// master password before parsing the decrypted payload into hosts.
export function useConnectionsLogic() {
  const { t } = useTranslation();
  const [vault, setVault] = useState<UnlockedVault | null>(() => getVaultSession());
  const [query, setQuery] = useState("");
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

  const document = useMemo(() => (vault ? parseVaultDocument(vault.payload) : null), [vault]);
  const totalHosts = document?.hosts.length ?? 0;

  const hosts = useMemo(() => {
    if (!document) return [];
    const needle = query.trim().toLowerCase();
    return document.hosts.filter((host) => matchesQuery(host, needle));
  }, [document, query]);

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

  const handleLock = useCallback(() => {
    clearVaultSession();
    setVault(null);
    setNoVault(false);
    setUnlockError(null);
    form.reset({ password: "" });
  }, [form]);

  return {
    form,
    onSubmit,
    unlockError,
    isUnlocking: mutation.isPending,
    vaultUnlocked: vault !== null,
    noVault,
    hosts,
    totalHosts,
    query,
    setQuery,
    handleLock,
  };
}
