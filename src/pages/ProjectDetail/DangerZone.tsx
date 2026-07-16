import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { ConfirmModal } from "./ConfirmModal";
import type { useProjectDetailLogic } from "./useProjectDetailLogic";

interface DangerZoneProps {
  readonly logic: ReturnType<typeof useProjectDetailLogic>;
}

// Leave / delete actions. The owner cannot leave (single-owner invariant) — they
// must transfer ownership first — so they see the delete action and a hint
// instead of a leave button.
export function DangerZone({ logic }: DangerZoneProps) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);

  const onConfirm = () => {
    if (confirm === "leave") logic.leave();
    else if (confirm === "delete") logic.deleteProject();
    setConfirm(null);
  };

  return (
    <section className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
      {logic.isOwner ? (
        <>
          <p className="text-[12px] text-dim">{t("projectDetail.danger.leaveOwner")}</p>
          <Button
            variant="secondary"
            onClick={() => setConfirm("delete")}
            loading={logic.deleting}
            data-testid="project-delete"
            className="w-auto px-4"
          >
            {t("projectDetail.danger.delete")}
          </Button>
        </>
      ) : (
        <>
          {logic.leaveIsOwnerBlocked ? (
            <p className="text-[12px] text-danger">{t("projectDetail.danger.leaveOwner")}</p>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => setConfirm("leave")}
            loading={logic.leaving}
            data-testid="project-leave"
            className="w-auto px-4"
          >
            {t("projectDetail.danger.leave")}
          </Button>
        </>
      )}
      <ConfirmModal
        open={confirm !== null}
        label={t("cards.project")}
        message={
          confirm === "delete"
            ? t("projectDetail.danger.deleteConfirm")
            : t("projectDetail.danger.leaveConfirm")
        }
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
        loading={false}
        testId="danger-confirm"
      />
    </section>
  );
}
