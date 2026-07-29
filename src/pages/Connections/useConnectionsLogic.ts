import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus } from "@/api/httpError";
import { getVault } from "@/api/wharf";
import {
  clearVaultSession,
  getRememberedHostCount,
  getVaultSession,
  rememberHostCount,
  setVaultSession,
} from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { fromBase64, unlockWithPassword } from "@/crypto";
import { parseVaultDocument, type VaultHost } from "@/lib/vaultDocument";
import { useProjectHosts } from "@/vault/useProjectHosts";
import { useHostListOverflow } from "./useHostListOverflow";

interface UnlockValues {
  password: string;
}

// A run of hosts under one heading: one per project the account can read, plus
// the personal vault. Project sections come first, matching wharf-mobile's
// hosts tab.
export type HostSection =
  | { readonly kind: "personal"; readonly key: string; readonly hosts: readonly VaultHost[] }
  | {
      readonly kind: "project";
      readonly key: string;
      readonly projectId: string;
      readonly name: string;
      readonly hosts: readonly VaultHost[];
    };

function matchesQuery(host: VaultHost, needle: string): boolean {
  if (!needle) return true;
  const haystack = [host.name, host.user, host.addr, ...(host.tags ?? [])].join(" ").toLowerCase();
  return haystack.includes(needle);
}

// Owns the connections view: reads the in-memory vault (primed at sign-in), and
// — after a reload drops the memory-only DEK — re-unlocks it locally from the
// master password before parsing the decrypted payload into hosts. Shared
// project hosts live in their own per-project blobs, so they are decrypted
// separately (useProjectHosts) and grouped alongside the personal ones — the
// list is the whole fleet, not just what this account stores privately.
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
  const projectHosts = useProjectHosts(vault);

  const personalHosts = document?.hosts ?? [];
  const totalHosts =
    personalHosts.length + projectHosts.groups.reduce((sum, g) => sum + g.hosts.length, 0);

  // Remember the size of the open *personal* vault so the locked screen can
  // still name it after a lock in this session — that screen describes the
  // sealed vault on this device, which never held the project blobs.
  useEffect(() => {
    if (document) rememberHostCount(document.hosts.length);
  }, [document]);

  const sections: readonly HostSection[] = useMemo(() => {
    if (!document) return [];
    const needle = query.trim().toLowerCase();
    const filter = (hosts: readonly VaultHost[]) => hosts.filter((h) => matchesQuery(h, needle));

    const projectSections = projectHosts.groups
      .map(
        (group): HostSection => ({
          kind: "project",
          key: `project:${group.id}`,
          projectId: group.id,
          name: group.name,
          hosts: filter(group.hosts),
        }),
      )
      // A section that filters down to nothing is dropped rather than shown as
      // an empty heading.
      .filter((section) => section.hosts.length > 0);

    const personal = filter(document.hosts);
    return personal.length > 0
      ? [...projectSections, { kind: "personal" as const, key: "personal", hosts: personal }]
      : projectSections;
  }, [document, projectHosts.groups, query]);

  const shownHosts = useMemo(
    () => sections.reduce((sum, section) => sum + section.hosts.length, 0),
    [sections],
  );

  const { listRef, listOverflowing } = useHostListOverflow(shownHosts);

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

  const clearFilter = useCallback(() => setQuery(""), []);

  const handleLock = useCallback(() => {
    clearVaultSession();
    setVault(null);
    setNoVault(false);
    setUnlockError(null);
    setQuery("");
    form.reset({ password: "" });
  }, [form]);

  const password = form.watch("password");

  return {
    form,
    onSubmit,
    unlockError,
    isUnlocking: mutation.isPending,
    canSubmit: password.length > 0,
    vaultUnlocked: vault !== null,
    noVault,
    sections,
    shownHosts,
    totalHosts,
    // The shared blobs decrypt after the personal vault opens, so the list can
    // still be growing while it is on screen.
    projectsLoading: projectHosts.loading,
    // Projects whose hosts exist but cannot be read here (awaiting a key, or an
    // identity this device cannot use) — stated rather than silently omitted.
    unreadableProjects: projectHosts.unreadable,
    query,
    setQuery,
    clearFilter,
    // The capped, scrollable list and whether it actually overflows, so the
    // hint under the card can only ever describe what is on screen.
    listRef,
    listOverflowing,
    // Known only if this session had the vault open; null on a cold load.
    lockedHostCount: getRememberedHostCount(),
    handleLock,
  };
}
