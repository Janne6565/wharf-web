import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { DeleteAccountModal } from "./DeleteAccountModal";

// Account-level destructive actions at the foot of the hub. The action itself
// only opens the confirmation — every gate lives in the modal.
export function DangerZone() {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <section className="mt-5 flex flex-col gap-2 border-t border-danger-border pt-4">
      <h3 className="flex items-center gap-2 text-[13px] font-bold text-danger">
        <TriangleAlert size={14} aria-hidden />
        {t("deleteAccount.heading")}
      </h3>
      <p className="text-[12.5px] leading-relaxed text-dim">{t("deleteAccount.intro")}</p>
      <Button
        variant="secondary"
        onClick={() => setConfirmOpen(true)}
        data-testid="delete-account-open"
        className="w-auto self-start px-4"
      >
        {t("deleteAccount.action")}
      </Button>
      <DeleteAccountModal open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </section>
  );
}
