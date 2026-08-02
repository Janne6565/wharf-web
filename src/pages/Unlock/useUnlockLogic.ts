import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus } from "@/api/httpError";
import { useAuthInformation } from "@/auth/useAuthInformation";
import { getVaultSession } from "@/auth/vaultSession";
import { unlockVaultWithPassword } from "@/auth/vaultUnlock";
import { CryptoError } from "@/crypto";

interface UnlockValues {
  password: string;
}

// Unlocks the vault of an already-authenticated session (e.g. right after an
// OAuth sign-in): fetch the vault blob and decrypt it locally with the master
// password — the same path Sign-in uses after login, except a wrong password
// here must surface inline instead of being best-effort.
export function useUnlockLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect: pendingRedirect } = useSearch({ strict: false }) as { redirect?: string };
  const { email } = useAuthInformation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({ password: z.string().min(1, t("validation.passwordRequired")) }),
    [t],
  );

  const form = useForm<UnlockValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
    mode: "onSubmit",
  });

  // If the vault is already primed in memory (e.g. the user unlocked earlier
  // this session and came back via the landing "profile" link), don't ask for
  // the master password again — go straight to their connections.
  useEffect(() => {
    if (getVaultSession()) {
      void navigate({ to: pendingRedirect ?? "/connections" });
    }
  }, [navigate, pendingRedirect]);

  const mutation = useMutation({
    mutationFn: (values: UnlockValues) => unlockVaultWithPassword(values.password),
    onSuccess: (primed) => {
      // No vault blob means onboarding was never finished — route there instead.
      void navigate({ to: primed ? (pendingRedirect ?? "/connections") : "/set-password" });
    },
    onError: (error: unknown) => {
      if (error instanceof CryptoError && error.code === "wrong-secret") {
        setSubmitError(t("unlock.wrongPassword"));
      } else if (getHttpStatus(error) === 429) {
        setSubmitError(t("errors.rateLimited"));
      } else {
        setSubmitError(t("errors.generic"));
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    mutation.mutate(values);
  });

  const password = form.watch("password");

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: mutation.isPending,
    email,
    canSubmit: password.length > 0,
  };
}
