import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import type { useConnectionsLogic } from "./useConnectionsLogic";

interface LockedVaultProps {
  readonly form: ReturnType<typeof useConnectionsLogic>["form"];
  readonly onSubmit: ReturnType<typeof useConnectionsLogic>["onSubmit"];
  readonly error: string | null;
  readonly loading: boolean;
  readonly canSubmit: boolean;
  // How many hosts the vault held when it was last open in this session, or
  // null on a cold load where the count cannot be known.
  readonly hostCount: number | null;
}

// Screen 1: the vault is sealed on this device. The master password decrypts it
// locally, so this is the only way in — hence the recovery-code escape hatch
// right below the button.
export function LockedVault({
  form,
  onSubmit,
  error,
  loading,
  canSubmit,
  hostCount,
}: LockedVaultProps) {
  const { t } = useTranslation();
  const { register, formState } = form;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-[34px] shrink-0 items-center justify-center border border-border bg-input text-accent">
          <Lock size={17} aria-hidden />
        </span>
        <div>
          <h2 className="text-[19px] font-bold text-text">{t("connections.title")}</h2>
          {/* The count is only real when this session already had the vault
              open. On a cold load nothing is persisted, so the line drops the
              number rather than inventing one. */}
          <p className="mt-[3px] text-[12.5px] text-dim" data-testid="connections-locked-subtitle">
            {hostCount === null
              ? t("connections.lockedSubtitle")
              : t("connections.lockedSubtitleCounted", { count: hostCount })}
          </p>
        </div>
      </div>
      <p className="mt-[22px] mb-5 text-[13px] leading-relaxed text-muted">
        {t("connections.lockedHint")}
      </p>
      <form onSubmit={onSubmit} noValidate>
        <FormField
          label={t("fields.masterPassword")}
          type="password"
          autoComplete="current-password"
          data-testid="connections-password"
          error={formState.errors.password?.message}
          {...register("password")}
        />
        {error ? <p className="mt-4 text-[13px] text-danger">{error}</p> : null}
        <Button
          type="submit"
          loading={loading}
          disabled={!canSubmit}
          data-testid="connections-unlock"
          className="mt-6"
        >
          {t("connections.unlock")}
        </Button>
      </form>
      <p className="mt-3.5 text-center">
        <Link to="/recover" className="text-[12.5px] text-accent hover:text-accent-strong">
          {t("signin.forgot")}
        </Link>
      </p>
    </div>
  );
}
