// The caller's project hosts, decrypted. Shared by the connections hub so its
// list is the whole fleet — personal vault plus every project the account can
// read — rather than the personal vault alone.
//
// Query keys are deliberately the same ones the projects screens use
// (["projectIdentity"], ["projects"], ["project", id, "vault"]), so a project
// opened from either side reuses one cache entry and one decrypt.

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ProjectSummary } from "@/api/generated/model";
import { listProjects } from "@/api/wharf";
import type { UnlockedVault } from "@/crypto";
import type { VaultHost, VaultIdentity } from "@/lib/vaultDocument";
import { ensureIdentity } from "./identity";
import { loadProjectVault } from "./projectVaultAccess";

const IDENTITY_KEY = ["projectIdentity"] as const;
const PROJECTS_KEY = ["projects"] as const;

// One project's decrypted hosts, ready to render as its own list section.
export interface ProjectHostGroup {
  readonly id: string;
  readonly name: string;
  readonly hosts: readonly VaultHost[];
}

export interface ProjectHostsResult {
  readonly groups: readonly ProjectHostGroup[];
  readonly loading: boolean;
  // Projects whose hosts cannot be shown here: no wrapped key yet, or an
  // identity this device cannot use (needs-sync / key-mismatch). Counted rather
  // than dropped silently — hiding hosts without saying so is the very bug this
  // hook exists to fix. Remediation lives on /projects.
  readonly unreadable: number;
}

const EMPTY: ProjectHostsResult = { groups: [], loading: false, unreadable: 0 };

type IdentifiedProject = ProjectSummary & { readonly id: string };

export function useProjectHosts(vault: UnlockedVault | null): ProjectHostsResult {
  const unlocked = vault !== null;

  const identityQuery = useQuery({
    queryKey: IDENTITY_KEY,
    queryFn: () => ensureIdentity(vault as UnlockedVault),
    enabled: unlocked,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const identity: VaultIdentity | null =
    identityQuery.data?.kind === "ready" ? identityQuery.data.identity : null;
  // needs-sync and key-mismatch both mean "we hold no usable identity here", so
  // no project blob can be opened at all.
  const identityUnusable = identityQuery.data !== undefined && identity === null;

  const listQuery = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => listProjects(),
    enabled: unlocked,
    retry: false,
  });

  const projects = useMemo(
    () => (listQuery.data ?? []).filter((p): p is IdentifiedProject => typeof p.id === "string"),
    [listQuery.data],
  );
  // A project the server has not sealed the DEK to us for is undecryptable by
  // construction; skip the fetch entirely.
  const readable = useMemo(() => projects.filter((p) => !p.awaitingKey), [projects]);
  const awaitingKey = projects.length - readable.length;

  const vaults = useQueries({
    queries: readable.map((project) => ({
      queryKey: ["project", project.id, "vault"] as const,
      queryFn: () => loadProjectVault(project.id, identity as VaultIdentity),
      enabled: unlocked && identity !== null,
      retry: false,
    })),
    // Structurally equal results keep their previous reference, so the derived
    // groups stay stable across renders even though useQueries rebuilds its
    // result array every time.
    combine: (results) => {
      const groups: ProjectHostGroup[] = [];
      let blocked = 0;
      results.forEach((result, index) => {
        const project = readable[index];
        if (!project) return;
        const data = result.data;
        if (!data || result.isError) {
          if (result.isError) blocked++;
          return;
        }
        if (data.awaiting) {
          blocked++;
          return;
        }
        if (data.hosts.length === 0) return;
        groups.push({ id: project.id, name: project.name ?? project.id, hosts: data.hosts });
      });
      return {
        groups,
        loading: results.some((result) => result.isLoading),
        blocked,
      };
    },
  });

  const loading =
    identityQuery.isLoading || listQuery.isLoading || (vaults.loading && !identityUnusable);

  return useMemo(() => {
    if (!unlocked) return EMPTY;
    return {
      groups: vaults.groups,
      loading,
      // With no usable identity every project is unreadable, however far the
      // per-project fetches got.
      unreadable: identityUnusable ? projects.length : awaitingKey + vaults.blocked,
    };
  }, [unlocked, vaults, loading, identityUnusable, projects.length, awaitingKey]);
}
