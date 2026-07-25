import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus, getProblemCode, PROBLEM_CODES } from "@/api/httpError";
import { resendVerification, verifyEmail } from "@/api/wharf";
import { establishSession } from "@/auth/session";
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
} from "@/auth/verificationHandoff";
import { isValidVerificationCode } from "@/lib/validators";

interface VerifyEmailValues {
  code: string;
}

// Matches the backend's per-account cooldown on /auth/resend-verification: a
// second request inside the window is silently dropped, so the button stays
// disabled for exactly as long.
const RESEND_COOLDOWN_SECONDS = 60;
const TICK_MS = 1000;

// Completes registration: submit the emailed 6-digit code, which is the call
// that finally issues a session (register itself returns no tokens).
//
// The address is not in a session yet, so it arrives either via the in-memory
// handoff (the sign-up flow) or as an ?email= search param (a blocked sign-in
// deep-linking here). The param wins when present, and its presence is also how
// we know this is *not* the onboarding run — the route guard guarantees at least
// one of the two exists.
export function useVerifyEmailLogic(emailParam?: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email] = useState(() => emailParam ?? getPendingVerificationEmail() ?? "");
  const onboarding = emailParam === undefined;

  const schema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .trim()
          .min(1, t("validation.codeRequired"))
          .refine(isValidVerificationCode, t("validation.codeInvalid")),
      }),
    [t],
  );

  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  const verify = useMutation({
    mutationFn: async (values: VerifyEmailValues) => {
      const session = await verifyEmail({
        email,
        code: values.code.trim(),
        tokenMode: "COOKIE",
      });
      if (session.accessToken) {
        await establishSession(session.accessToken, session.user);
      }
    },
    onSuccess: () => {
      clearPendingVerificationEmail();
      void navigate({ to: "/device", search: { onboarding } });
    },
    onError: (error: unknown) => {
      // One generic message for every rejection: the backend deliberately does
      // not distinguish wrong / expired / missing / attempts-exhausted.
      if (getProblemCode(error) === PROBLEM_CODES.invalidVerificationCode) {
        setSubmitError(t("verifyEmail.invalidCode"));
      } else if (getHttpStatus(error) === 429) {
        setSubmitError(t("errors.rateLimited"));
      } else {
        setSubmitError(t("errors.generic"));
      }
    },
  });

  const resend = useMutation({
    mutationFn: () => resendVerification({ email }),
    // The endpoint answers 202 whether or not the address is registered, so the
    // UI must confirm identically in every outcome — anything else would turn it
    // into an account-existence oracle.
    onSettled: () => setResent(true),
  });

  const handleResend = useCallback(() => {
    setSubmitError(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    resend.mutate();
  }, [resend.mutate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = globalThis.setInterval(() => setCooldown((left) => Math.max(0, left - 1)), TICK_MS);
    return () => globalThis.clearInterval(id);
  }, [cooldown]);

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    verify.mutate(values);
  });

  const code = form.watch("code");

  return {
    form,
    email,
    onSubmit,
    submitError,
    isSubmitting: verify.isPending,
    canSubmit: code.trim().length > 0,
    handleResend,
    resent,
    isResending: resend.isPending,
    cooldown,
  };
}
