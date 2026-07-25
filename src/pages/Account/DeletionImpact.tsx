import { Folder, Users } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import type { ProjectHostCounts } from "./projectHostCounts";
import type {
  OwnedProjectImpact,
  useDeleteAccountLogic,
  VaultContents,
} from "./useDeleteAccountLogic";

type DeleteAccountLogic = ReturnType<typeof useDeleteAccountLogic>;

// What deleting the account destroys, read from the server-side preview plus
// the locally-decrypted vaults.
export function DeletionImpact({ logic }: { readonly logic: DeleteAccountLogic }) {
  const { t } = useTranslation();
  if (logic.previewLoading) {
    return (
      <p className="px-[26px] pt-[22px] text-[13px] text-dim">
        {t("deleteAccount.previewLoading")}
      </p>
    );
  }
  if (logic.previewFailed || !logic.preview) {
    return (
      <p className="px-[26px] pt-[22px] text-[13px] text-danger">
        {t("deleteAccount.previewFailed")}
      </p>
    );
  }
  const { ownedProjects, otherMemberships } = logic.preview;
  return (
    <>
      {ownedProjects.length > 0 ? (
        <OwnedProjects projects={ownedProjects} hostCounts={logic.projectHostCounts} />
      ) : (
        <p
          data-testid="delete-account-no-projects"
          className="px-[26px] pt-[22px] text-[13px] leading-relaxed text-muted"
        >
          {t("deleteAccount.noProjects")}
        </p>
      )}
      {otherMemberships > 0 ? (
        <p className="px-[26px] pt-3 text-[12.5px] leading-relaxed text-muted">
          {t("deleteAccount.otherMemberships", { count: otherMemberships })}
        </p>
      ) : null}
      <VaultWarning contents={logic.vaultContents} />
    </>
  );
}

interface OwnedProjectsProps {
  readonly projects: readonly OwnedProjectImpact[];
  readonly hostCounts: ProjectHostCounts;
}

// The projects that die with the account, one row each.
function OwnedProjects({ projects, hostCounts }: OwnedProjectsProps) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="delete-account-owned"
      className="mx-[26px] mt-[22px] border border-border bg-input"
    >
      <div className="border-b border-border-subtle px-3.5 py-2.5 text-[11.5px] tracking-[0.08em] text-dim uppercase">
        {t("deleteAccount.ownedHeading")}
      </div>
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} hostCount={hostCounts[project.id]} />
      ))}
    </div>
  );
}

interface ProjectRowProps {
  readonly project: OwnedProjectImpact;
  // Undefined while the count is still loading, null when this project could
  // not be opened. Both render as no number rather than a misleading zero.
  readonly hostCount: number | null | undefined;
}

function ProjectRow({ project, hostCount }: ProjectRowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 border-b border-border-subtle px-3.5 py-[11px] last:border-b-0">
      <Folder size={15} aria-hidden className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-text">{project.name}</span>
      {typeof hostCount === "number" ? (
        <span className="shrink-0 text-[12px] text-dim">
          {t("deleteAccount.projectHosts", { count: hostCount })}
        </span>
      ) : null}
      {project.otherMemberCount > 0 ? (
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-warn">
          <Users size={14} aria-hidden />
          {t("deleteAccount.projectMembers", { count: project.otherMemberCount })}
        </span>
      ) : (
        <span className="shrink-0 text-[12px] text-dim">
          {t("deleteAccount.projectMembersNone")}
        </span>
      )}
    </div>
  );
}

// The vault half of the warning. With the vault open we can say exactly what it
// holds; locked, the counts are unknowable — so the warning drops the numbers
// instead of printing zeros, which would understate the loss.
function VaultWarning({ contents }: { readonly contents: VaultContents | null }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      data-testid="delete-account-vault-warning"
      className="mx-[26px] mt-4 border border-danger-border border-l-[3px] border-l-danger bg-danger-bg px-4 py-[13px] text-[12.5px] leading-[1.7] text-danger"
    >
      {contents ? (
        <Trans
          i18nKey="deleteAccount.vaultWarningCounted"
          values={{ counts: countsSentence(t, contents) }}
          components={{ 1: <strong className="font-bold" />, 3: <strong className="font-bold" /> }}
        />
      ) : (
        <Trans
          i18nKey="deleteAccount.vaultWarningLocked"
          components={{ 3: <strong className="font-bold" /> }}
        />
      )}
    </div>
  );
}

type Translate = ReturnType<typeof useTranslation>["t"];

// "12 hosts, 5 ssh keys, 7 stored passwords" — each part pluralised on its own.
export function countsSentence(t: Translate, contents: VaultContents): string {
  return [
    t("deleteAccount.vaultCounts.hosts", { count: contents.hosts }),
    t("deleteAccount.vaultCounts.keys", { count: contents.keys }),
    t("deleteAccount.vaultCounts.passwords", { count: contents.passwords }),
  ].join(", ");
}
