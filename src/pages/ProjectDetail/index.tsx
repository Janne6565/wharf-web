import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
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
  if (logic.loading || !logic.project) {
    return <p className="py-6 text-center text-[13px] text-dim">{t("projectDetail.loading")}</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      <BackLink />
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

function BackLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/projects"
      className="flex items-center gap-1.5 text-[13px] text-dim hover:text-accent"
    >
      <ArrowLeft size={14} aria-hidden />
      {t("projectDetail.back")}
    </Link>
  );
}
