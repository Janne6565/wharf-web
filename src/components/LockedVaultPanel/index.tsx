import { useTranslation } from "react-i18next";
import type { VaultUnlockGate } from "@/auth/useVaultUnlock";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";

interface LockedVaultPanelProps {
  readonly gate: VaultUnlockGate;
  readonly testIdPrefix: string;
}

// The in-place unlock panel shown when a vault-gated screen is locked (the same
// pattern as the connections hub): a master-password field that decrypts the
// pulled blob locally. Composed from a shared useVaultUnlock gate so the actual
// unlock logic lives in one place.
export function LockedVaultPanel({ gate, testIdPrefix }: LockedVaultPanelProps) {
  const { t } = useTranslation();
  const { register, formState } = gate.form;
  return (
    <div>
      <p className="mb-6 text-[13px] leading-relaxed text-muted">{t("connections.lockedHint")}</p>
      <form onSubmit={gate.onSubmit} noValidate>
        <FormField
          label={t("fields.masterPassword")}
          type="password"
          autoComplete="current-password"
          data-testid={`${testIdPrefix}-password`}
          error={formState.errors.password?.message}
          {...register("password")}
        />
        {gate.unlockError ? (
          <p className="mt-4 text-[13px] text-danger">{gate.unlockError}</p>
        ) : null}
        <Button
          type="submit"
          loading={gate.isUnlocking}
          disabled={!gate.canSubmit}
          data-testid={`${testIdPrefix}-unlock`}
          className="mt-6"
        >
          {t("connections.unlock")}
        </Button>
      </form>
    </div>
  );
}
