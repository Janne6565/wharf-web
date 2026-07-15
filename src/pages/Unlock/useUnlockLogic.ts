import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus } from "@/api/httpError";
import { useAuthInformation } from "@/auth/useAuthInformation";
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

  const mutation = useMutation({
    mutationFn: (values: UnlockValues) => unlockVaultWithPassword(values.password),
    onSuccess: (primed) => {
      // No vault blob means onboarding was never finished — route there instead.
      void navigate({ to: primed ? "/device" : "/set-password" });
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

  return { form, onSubmit, submitError, isSubmitting: mutation.isPending, email };
}
