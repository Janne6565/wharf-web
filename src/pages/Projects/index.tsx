import { useTranslation } from "react-i18next";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { LockedVaultPanel } from "@/components/LockedVaultPanel";
import { CreateProjectForm } from "./CreateProjectForm";
import { InvitesBanner } from "./InvitesBanner";
import { ProjectList } from "./ProjectList";
import { useProjectsLogic } from "./useProjectsLogic";

export function ProjectsPage() {
  const { t } = useTranslation();
  const logic = useProjectsLogic();
  const { gate } = logic;

  return (
    <AuthShell backTo="/connections">
      <Card label={t("cards.projects")} maxWidth={640}>
        <Header count={logic.projects.length} unlocked={gate.vaultUnlocked} onLock={gate.lock} />
        {gate.vaultUnlocked ? (
          <UnlockedBody logic={logic} />
        ) : (
          <LockedVaultPanel gate={gate} testIdPrefix="projects" />
        )}
      </Card>
    </AuthShell>
  );
}

interface HeaderProps {
  readonly count: number;
  readonly unlocked: boolean;
  readonly onLock: () => void;
}

function Header({ count, unlocked, onLock }: HeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-[20px] font-bold text-text">{t("projects.title")}</h2>
        {unlocked ? (
          <span className="text-[12.5px] text-dim">{t("projects.count", { count })}</span>
        ) : null}
      </div>
      {unlocked ? (
        <button
          type="button"
          onClick={onLock}
          data-testid="projects-lock"
          className="text-[12.5px] text-dim hover:text-accent"
        >
          [ {t("projects.lock")} ]
        </button>
      ) : null}
    </div>
  );
}

function UnlockedBody({ logic }: { readonly logic: ReturnType<typeof useProjectsLogic> }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      {logic.identityState === "needs-sync" ? (
        <Alert tone="warning" className="mt-1">
          {t("projects.identity.needsSync")}
        </Alert>
      ) : null}
      {logic.identityState === "error" ? (
        <Alert tone="danger" className="mt-1">
          {t("projects.identity.error")}
        </Alert>
      ) : null}
      <InvitesBanner
        invites={logic.invites}
        onAccept={logic.acceptInvite}
        onDecline={logic.declineInvite}
        pendingId={logic.invitePendingId}
      />
      <CreateProjectForm
        open={logic.createOpen}
        onToggle={logic.toggleCreate}
        form={logic.form}
        onSubmit={logic.onCreateSubmit}
        canSubmit={logic.canCreate}
        loading={logic.isCreating}
        error={logic.createError}
        disabled={logic.identityState !== "ready"}
      />
      <ProjectList projects={logic.projects} loading={logic.listLoading} error={logic.listError} />
    </div>
  );
}
