import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { IdentityNotice } from "@/components/IdentityNotice";
import { KeyMismatchNotice } from "@/components/KeyMismatchNotice";
import { LockedVaultPanel } from "@/components/LockedVaultPanel";
import { DangerZone } from "./DangerZone";
import { HostsCard } from "./HostsCard";
import { InviteModal } from "./InviteModal";
import { MembersCard } from "./MembersCard";
import { MetadataHeader } from "./MetadataHeader";
import { useProjectDetailLogic } from "./useProjectDetailLogic";

interface ProjectDetailPageProps {
  readonly projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const { t } = useTranslation();
  const logic = useProjectDetailLogic(projectId);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <AuthShell backTo="/projects">
      <Card label={t("cards.project")} maxWidth={640}>
        {logic.gate.vaultUnlocked ? (
          <Body logic={logic} inviteOpen={inviteOpen} setInviteOpen={setInviteOpen} />
        ) : (
          <LockedVaultPanel gate={logic.gate} testIdPrefix="project" />
        )}
      </Card>
    </AuthShell>
  );
}

interface BodyProps {
  readonly logic: ReturnType<typeof useProjectDetailLogic>;
  readonly inviteOpen: boolean;
  readonly setInviteOpen: (open: boolean) => void;
}

function Body({ logic, inviteOpen, setInviteOpen }: BodyProps) {
  const { t } = useTranslation();
  if (logic.notFound) {
    return <Alert tone="danger">{t("projectDetail.notFound")}</Alert>;
  }
  // No identity locally but the server has a key: the hosts blob can't be
  // decrypted here, so surface the same needs-sync notice as the hub (with its
  // reset action) instead of leaving the hosts list spinning indefinitely.
  if (logic.identityState === "needs-sync" && logic.gate.vault) {
    return <IdentityNotice vault={logic.gate.vault} />;
  }
  // The server's published key for this account isn't ours: nothing sealed to it
  // can be trusted, so show only the warning rather than the project.
  if (logic.keyMismatch && logic.gate.vault) {
    return (
      <KeyMismatchNotice
        vault={logic.gate.vault}
        localFingerprint={logic.keyMismatch.localFingerprint}
        serverFingerprint={logic.keyMismatch.serverFingerprint}
      />
    );
  }
  if (logic.loading || !logic.project) {
    return <p className="py-6 text-center text-[13px] text-dim">{t("projectDetail.loading")}</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      <MetadataHeader
        name={logic.project.name ?? ""}
        description={logic.project.description ?? ""}
        hostCount={logic.vault.hosts.length}
        canEdit={logic.canAdmin}
        saving={logic.metaSaving}
        error={logic.metaError}
        onSave={logic.updateMeta}
      />
      <MembersCard logic={logic} onInviteClick={() => setInviteOpen(true)} />
      <HostsCard
        hosts={logic.vault.hosts}
        awaiting={logic.vault.awaiting}
        loading={logic.vault.loading}
      />
      <DangerZone logic={logic} />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={logic.inviteMember}
        saving={logic.inviteSaving}
        error={logic.inviteError}
        done={logic.inviteDone}
        reset={logic.resetInvite}
      />
    </div>
  );
}
