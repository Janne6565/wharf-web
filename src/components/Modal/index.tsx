import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useModalLogic } from "./useModalLogic";

type Tone = "default" | "danger";

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  // The label chip notched into the panel's top border (mirrors <Card>).
  readonly label: string;
  // Max panel width in px (mirrors <Card>); defaults to 440.
  readonly maxWidth?: number;
  // "danger" paints the panel border red, for confirmations whose outcome is
  // destructive and irreversible.
  readonly tone?: Tone;
  // Off when the dialog's own sections carry the padding (the delete-account
  // confirmation runs its project table and warning edge to edge).
  readonly padded?: boolean;
  readonly children: ReactNode;
  readonly "data-testid"?: string;
}

const DEFAULT_MAX_WIDTH = 440;

const TONES: Record<Tone, string> = {
  default: "border-border",
  danger: "border-danger-border",
};

// The label chip sits on the panel itself, so it takes the panel's background
// (unlike <Card>, whose chip sits on the page).
const LABEL_TONES: Record<Tone, string> = {
  default: "text-dim",
  danger: "text-danger",
};

// A centered dialog over a dimmed backdrop, styled like <Card> (square panel,
// 1px border, notched label chip). Closes on Escape, backdrop click, or the
// corner close button. The backdrop is a real <button> so the click target is
// keyboard-accessible without an extra handler.
export function Modal({
  open,
  onClose,
  label,
  maxWidth = DEFAULT_MAX_WIDTH,
  tone = "default",
  padded = true,
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
        className="absolute inset-0 cursor-default bg-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid={testId}
        style={{ maxWidth }}
        className={cn(
          "relative mx-auto w-full border bg-card shadow-[0_24px_70px_rgba(0,0,0,0.6)]",
          padded && "p-5 sm:p-8",
          TONES[tone],
        )}
      >
        <span
          className={cn("absolute -top-2.5 left-3 bg-card px-2 text-[12.5px]", LABEL_TONES[tone])}
        >
          {label}
        </span>
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
