import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useModalLogic } from "./useModalLogic";

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  // The label chip notched into the panel's top border (mirrors <Card>).
  readonly label: string;
  // Max panel width in px (mirrors <Card>); defaults to 440.
  readonly maxWidth?: number;
  readonly children: ReactNode;
  readonly "data-testid"?: string;
}

const DEFAULT_MAX_WIDTH = 440;

// A centered dialog over a dimmed backdrop, styled like <Card> (square panel,
// 1px border, notched label chip). Closes on Escape, backdrop click, or the
// corner close button. The backdrop is a real <button> so the click target is
// keyboard-accessible without an extra handler.
export function Modal({
  open,
  onClose,
  label,
  maxWidth = DEFAULT_MAX_WIDTH,
  children,
  "data-testid": testId,
}: ModalProps) {
  const { t } = useTranslation();
  useModalLogic(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bg/80"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid={testId}
        style={{ maxWidth }}
        className="relative mx-auto w-full border border-border bg-card p-5 sm:p-8"
      >
        <span className="absolute -top-2.5 left-3 bg-bg px-2 text-[13px] text-dim">{label}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          data-testid="modal-close"
          className="absolute top-3 right-3 text-dim hover:text-accent"
        >
          <X size={16} aria-hidden />
        </button>
        {children}
      </div>
    </div>
  );
}
