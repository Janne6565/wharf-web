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
import { buildOnboardingVault } from "@/auth/vaultOnboarding";
import { setVaultSession } from "@/auth/vaultSession";
import { setPendingVerificationEmail } from "@/auth/verificationHandoff";
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
//
// Registering no longer signs the user in: the backend answers 202 with no
// tokens and no cookie, and the session is only issued once the emailed code is
// submitted on /welcome/verify-email. So we hand the address on too.
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

      await registerAccount({
        email,
        authKey,
        recoveryAuthKey,
        vault: toBase64(blob),
      });

      return { email, recoveryCode, vault };
    },
    onSuccess: ({ email, recoveryCode, vault }) => {
      setVaultSession(vault);
      setPendingRecoveryCode(recoveryCode);
      setPendingVerificationEmail(email);
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

  const email = form.watch("email");
  const password = form.watch("password");
  const confirm = form.watch("confirm");
  const understand = form.watch("understand");

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: mutation.isPending,
    password,
    understand,
    setUnderstand: (checked: boolean) =>
      form.setValue("understand", checked, { shouldValidate: form.formState.isSubmitted }),
    canSubmit: email.trim().length > 0 && password.length > 0 && confirm.length > 0 && understand,
  };
}
