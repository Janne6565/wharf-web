import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus, getProblemCode, PROBLEM_CODES } from "@/api/httpError";
import { login } from "@/api/wharf";
import { establishSession } from "@/auth/session";
import { unlockVaultWithPassword } from "@/auth/vaultUnlock";
import { deriveAuthKey, deriveMasterKey, normalizeEmail } from "@/crypto";
import { isValidEmail } from "@/lib/validators";

interface SigninValues {
  email: string;
  password: string;
}

// Signs in: derive authKey, authenticate (COOKIE mode), then fetch and unlock
// the vault locally to prove the password and prime the vault in memory.
export function useSigninLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Set when the account exists but its address was never verified: the screen
  // then offers a link on to the verification step, carrying the typed address.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t("validation.emailRequired"))
          .refine(isValidEmail, t("validation.emailInvalid")),
        password: z.string().min(1, t("validation.passwordRequired")),
      }),
    [t],
  );

  const form = useForm<SigninValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (values: SigninValues) => {
      const email = normalizeEmail(values.email);
      const masterKey = await deriveMasterKey(values.password, email);
      const authKey = await deriveAuthKey(masterKey);

      const session = await login({ email, authKey, tokenMode: "COOKIE" });
      if (session.accessToken) {
        await establishSession(session.accessToken, session.user);
      }

      // Best-effort: the server already validated the credential, so unlock the
      // vault locally to prime it in memory. A failure here doesn't invalidate
      // the (already established) session.
      try {
        await unlockVaultWithPassword(values.password);
      } catch {
        // Ignore — session is valid regardless of vault priming.
      }
    },
    onSuccess: () => {
      void navigate({ to: "/connections" });
    },
    onError: (error: unknown) => {
      const status = getHttpStatus(error);
      if (status === 403 && getProblemCode(error) === PROBLEM_CODES.emailNotVerified) {
        setUnverifiedEmail(normalizeEmail(form.getValues("email")));
        setSubmitError(t("errors.emailNotVerified"));
      } else if (status === 401) {
        setSubmitError(t("errors.invalidCredentials"));
      } else if (status === 429) {
        setSubmitError(t("errors.rateLimited"));
      } else {
        setSubmitError(t("errors.generic"));
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    setUnverifiedEmail(null);
    mutation.mutate(values);
  });

  const email = form.watch("email");
  const password = form.watch("password");

  return {
    form,
    onSubmit,
    submitError,
    unverifiedEmail,
    isSubmitting: mutation.isPending,
    canSubmit: email.trim().length > 0 && password.length > 0,
  };
}
