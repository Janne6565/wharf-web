import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectInvite, ProjectMember } from "@/api/generated/model";
import { Alert } from "@/components/Alert";
import { ROLE_ORDER, roleLabelKey } from "@/lib/projectRole";
import { ConfirmModal } from "./ConfirmModal";
import type { Role, useProjectDetailLogic } from "./useProjectDetailLogic";

interface MembersCardProps {
  readonly logic: ReturnType<typeof useProjectDetailLogic>;
  readonly onInviteClick: () => void;
}

type Confirm = { kind: "remove" | "transfer"; member: ProjectMember } | null;

// The MEMBERS card: every member with avatar initials, identity, "(you)" and
// role; owner-only role changes (including OWNER = transfer, confirmed); admin/
// owner member removal (client-side rotation, confirmed); the "+ invite member"
// action; and the pending-invite rows with revoke.
export function MembersCard({ logic, onInviteClick }: MembersCardProps) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const members = logic.project?.members ?? [];
  const invites = logic.project?.invites ?? [];

  const onConfirm = () => {
    if (!confirm?.member.userId) return;
    if (confirm.kind === "remove") logic.removeMember(confirm.member.userId);
    else logic.changeRole(confirm.member.userId, "OWNER");
    setConfirm(null);
  };

  const message =
    confirm?.kind === "remove"
      ? t("projectDetail.danger.removeConfirm", {
          name: confirm.member.email ?? "",
          project: logic.project?.name ?? "",
        })
      : t("projectDetail.danger.transferConfirm", { name: confirm?.member.email ?? "" });

  return (
    <section>
      <h3 className="mb-2 text-[12px] font-bold tracking-wide text-dim uppercase">
        {t("projectDetail.members.heading")}
      </h3>
      {logic.removeError ? (
        <Alert tone="danger" className="mb-2">
          {t("projectDetail.errors.removeFailed")}
        </Alert>
      ) : null}
      <div className="flex flex-col divide-y divide-border border border-border">
        {members.map((member) => (
          <MemberRow key={member.userId} member={member} logic={logic} onAsk={setConfirm} />
        ))}
        {logic.canAdmin ? (
          <button
            type="button"
            onClick={onInviteClick}
            data-testid="members-invite"
            className="flex items-center gap-2 px-4 py-3 text-[14px] font-semibold text-accent hover:text-accent-strong"
          >
            <Plus size={16} aria-hidden />
            {t("projectDetail.members.invite")}
          </button>
        ) : null}
      </div>
      <PendingInvites invites={invites} logic={logic} />
      <ConfirmModal
        open={confirm !== null}
        label={t("cards.project")}
        message={message}
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
        loading={false}
        testId="member-confirm"
      />
    </section>
  );
}

interface MemberRowProps {
  readonly member: ProjectMember;
  readonly logic: ReturnType<typeof useProjectDetailLogic>;
  readonly onAsk: (confirm: Confirm) => void;
}

function initials(email: string | undefined): string {
  return (email ?? "?").slice(0, 2).toUpperCase();
}

function canRemove(logic: MemberRowProps["logic"], member: ProjectMember): boolean {
  if (!logic.canAdmin || member.role === "OWNER" || logic.isYou(member.userId)) return false;
  return logic.isOwner || member.role !== "ADMIN";
}

function MemberRow({ member, logic, onAsk }: MemberRowProps) {
  const { t } = useTranslation();
  const busy = logic.removeTargetId === member.userId || logic.roleTargetId === member.userId;
  const editableRole = logic.isOwner && !logic.isYou(member.userId);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-row-active text-[13px] text-accent">
        {initials(member.email)}
      </span>
      <div className="min-w-0 flex-1 truncate text-[14px] text-text">
        {member.email}
        {logic.isYou(member.userId) ? (
          <span className="ml-1.5 text-dim">{t("projectDetail.you")}</span>
        ) : null}
      </div>
      {editableRole ? (
        <RoleSelect member={member} logic={logic} onAsk={onAsk} />
      ) : (
        <span className="text-[13px] text-dim">{t(roleLabelKey(member.role))}</span>
      )}
      {canRemove(logic, member) ? (
        <button
          type="button"
          onClick={() => onAsk({ kind: "remove", member })}
          disabled={busy}
          aria-label={t("projectDetail.members.remove")}
          data-testid={`member-remove-${member.userId}`}
          className="flex-none text-dim hover:text-danger disabled:opacity-50"
        >
          <X size={15} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function RoleSelect({ member, logic, onAsk }: MemberRowProps) {
  const { t } = useTranslation();
  return (
    <select
      value={member.role}
      disabled={logic.roleTargetId === member.userId}
      data-testid={`member-role-${member.userId}`}
      onChange={(e) => {
        const next = e.target.value as Role;
        if (next === member.role) return;
        if (next === "OWNER") onAsk({ kind: "transfer", member });
        else if (member.userId) logic.changeRole(member.userId, next);
      }}
      className="border border-border bg-input px-2 py-1 text-[12.5px] text-subtle"
    >
      {ROLE_ORDER.map((r) => (
        <option key={r} value={r}>
          {t(roleLabelKey(r))}
        </option>
      ))}
    </select>
  );
}

interface PendingInvitesProps {
  readonly invites: readonly ProjectInvite[];
  readonly logic: ReturnType<typeof useProjectDetailLogic>;
}

function PendingInvites({ invites, logic }: PendingInvitesProps) {
  const { t } = useTranslation();
  if (invites.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center gap-2.5 px-1">
          <span className="text-warn" aria-hidden>
            ○
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-warn">{invite.email}</span>
          <span className="text-[12px] text-dim">{t("projectDetail.invite.pending")}</span>
          {logic.canAdmin ? (
            <button
              type="button"
              onClick={() => invite.id && logic.revokeInvite(invite.id)}
              disabled={logic.revokingId === invite.id}
              aria-label={t("projectDetail.invite.revoke")}
              data-testid={`invite-revoke-${invite.id}`}
              className="flex-none text-dim hover:text-danger disabled:opacity-50"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
