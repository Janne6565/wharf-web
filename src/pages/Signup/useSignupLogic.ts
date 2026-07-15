import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus } from "@/api/httpError";
import { registerAccount } from "@/api/wharf";
import { setPendingRecoveryCode } from "@/auth/recoveryHandoff";
import { establishSession } from "@/auth/session";
import { buildOnboardingVault } from "@/auth/vaultOnboarding";
import { setVaultSession } from "@/auth/vaultSession";
import { normalizeEmail, toBase64 } from "@/crypto";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "@/lib/validators";

interface SignupValues {
  email: string;
  password: string;
  confirm: string;
  understand: boolean;
}

// Runs the full client-side sign-up: derive keys, build a fresh vault, register
// (server sees only authKey/recoveryAuthKey + ciphertext), prime the vault in
// memory, and hand the one-time recovery code to the next screen.
export function useSignupLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          email: z
            .string()
            .trim()
            .min(1, t("validation.emailRequired"))
            .refine(isValidEmail, t("validation.emailInvalid")),
          password: z
            .string()
            .min(1, t("validation.passwordRequired"))
            .min(PASSWORD_MIN_LENGTH, t("validation.passwordTooShort")),
          confirm: z.string(),
          understand: z.boolean().refine((v) => v, t("validation.mustAcknowledge")),
        })
        .refine((data) => data.password === data.confirm, {
          path: ["confirm"],
          message: t("validation.confirmMismatch"),
        }),
    [t],
  );

  const form = useForm<SignupValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirm: "", understand: false },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (values: SignupValues) => {
      const email = normalizeEmail(values.email);
      const { authKey, recoveryAuthKey, blob, recoveryCode, vault } = await buildOnboardingVault(
        email,
        values.password,
      );

      const response = await registerAccount({
        email,
        authKey,
        recoveryAuthKey,
        vault: toBase64(blob),
      });

      return { response, recoveryCode, vault };
    },
    onSuccess: async ({ response, recoveryCode, vault }) => {
      setVaultSession(vault);
      if (response.tokens?.accessToken) {
        await establishSession(response.tokens.accessToken, response.user);
      }
      setPendingRecoveryCode(recoveryCode);
      void navigate({ to: "/welcome/recovery-code" });
    },
    onError: (error: unknown) => {
      const status = getHttpStatus(error);
      if (status === 409) {
        setSubmitError(t("errors.emailTaken"));
      } else if (status === 429) {
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

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: mutation.isPending,
    password: form.watch("password"),
    understand: form.watch("understand"),
    setUnderstand: (checked: boolean) =>
      form.setValue("understand", checked, { shouldValidate: form.formState.isSubmitted }),
  };
}
