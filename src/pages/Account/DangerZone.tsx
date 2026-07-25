import { Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DeleteAccountModal } from "./DeleteAccountModal";

// Account-level destructive actions, fenced off in a red-bordered box at the
// foot of the account screen. The action itself only opens the confirmation —
// every gate lives in the modal.
export function DangerZone() {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <section className="relative mt-[34px] border border-danger-border bg-danger-bg px-5 pt-[22px] pb-5">
      <span className="absolute -top-2.5 left-3 flex items-center gap-1.5 bg-card px-2 text-[12.5px] text-danger">
        <TriangleAlert size={13} aria-hidden />
        {t("deleteAccount.heading")}
      </span>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h3 className="text-[14px] font-bold text-danger">{t("deleteAccount.dangerTitle")}</h3>
          <p className="mt-1.5 max-w-[360px] text-[12.5px] leading-relaxed text-danger-muted">
            {t("deleteAccount.intro")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          data-testid="delete-account-open"
          className="flex shrink-0 items-center gap-2 border border-danger px-[14px] py-[9px] text-[12.5px] font-bold text-danger hover:bg-danger hover:text-danger-ink"
        >
          <Trash2 size={15} aria-hidden />
          {"[ "}
          {t("deleteAccount.action")}
          {" ]"}
        </button>
      </div>
      <DeleteAccountModal open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </section>
  );
}
