import { useTranslation } from "react-i18next";
import type { MyInvite } from "@/api/generated/model";
import { Button } from "@/components/Button";

interface InvitesBannerProps {
  readonly invites: readonly MyInvite[];
  readonly onAccept: (id: string) => void;
  readonly onDecline: (id: string) => void;
  readonly pendingId: string | undefined;
}

// The incoming-invite banner: one row per pending invite with inline accept /
// decline. Hidden entirely when there are no invites.
export function InvitesBanner({ invites, onAccept, onDecline, pendingId }: InvitesBannerProps) {
  const { t } = useTranslation();
  if (invites.length === 0) return null;
  return (
    <div className="border border-warn-border bg-warn-bg px-4 py-3">
      <p className="mb-2.5 text-[12px] font-bold tracking-wide text-warn">
        {t("projects.invites.heading")}
      </p>
      <div className="flex flex-col gap-2.5">
        {invites.map((invite) => (
          <InviteRow
            key={invite.id}
            invite={invite}
            busy={pendingId === invite.id}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </div>
    </div>
  );
}

interface InviteRowProps {
  readonly invite: MyInvite;
  readonly busy: boolean;
  readonly onAccept: (id: string) => void;
  readonly onDecline: (id: string) => void;
}

function InviteRow({ invite, busy, onAccept, onDecline }: InviteRowProps) {
  const { t } = useTranslation();
  const id = invite.id ?? "";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-[14px] text-text">{invite.projectName}</div>
        <div className="truncate text-[12px] text-dim">
          {t("projects.invites.invitedBy", { email: invite.invitedByEmail ?? "" })}
        </div>
      </div>
      <div className="flex flex-none gap-2">
        <Button
          variant="secondary"
          loading={busy}
          onClick={() => onAccept(id)}
          data-testid={`invite-accept-${id}`}
          className="w-auto px-3"
        >
          {t("projects.invites.accept")}
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => onDecline(id)}
          data-testid={`invite-decline-${id}`}
          className="w-auto px-3"
        >
          {t("projects.invites.decline")}
        </Button>
      </div>
    </div>
  );
}
