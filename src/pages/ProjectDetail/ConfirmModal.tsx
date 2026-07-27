import { useTranslation } from "react-i18next";
import { Button, PAIRED_CANCEL_CLASS } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface ConfirmModalProps {
  readonly open: boolean;
  readonly label: string;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly loading: boolean;
  readonly testId?: string;
}

// A small confirm dialog for the destructive project actions (remove member,
// transfer ownership, leave, delete). The message is fully rendered copy passed
// by the caller so the modal stays generic.
export function ConfirmModal({
  open,
  label,
  message,
  onConfirm,
  onCancel,
  loading,
  testId,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} label={label} data-testid={testId}>
      <p className="mt-2 mb-6 text-[13px] leading-relaxed text-muted">{message}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          loading={loading}
          onClick={onConfirm}
          data-testid={testId ? `${testId}-confirm` : undefined}
        >
          {t("projectDetail.danger.confirm")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className={PAIRED_CANCEL_CLASS}
        >
          {t("projectDetail.danger.cancel")}
        </Button>
      </div>
    </Modal>
  );
}
