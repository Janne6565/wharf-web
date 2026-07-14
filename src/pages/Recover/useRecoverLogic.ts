import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus } from "@/api/httpError";
import { recoverReset, recoverVerify } from "@/api/wharf";
import { setPendingRecoveryCode } from "@/auth/recoveryHandoff";
import { establishSession } from "@/auth/session";
import { setVaultSession } from "@/auth/vaultSession";
import {
  deriveAuthKey,
  deriveMasterKey,
  deriveRecoveryAuthKey,
  fromBase64,
  looksLikeRecoveryCode,
  normalizeEmail,
  normalizeRecovery,
  recoverySecretFromCode,
  reEncrypt,
  toBase64,
  type UnlockedVault,
  unlockWithRecovery,
} from "@/crypto";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "@/lib/validators";

type VerifyPhase = "idle" | "verifying" | "valid";

interface RecoverValues {
  email: string;
  recoveryCode: string;
  newPassword: string;
}

// Drives the password-reset-via-recovery-code flow: verify the code against the
// server, download and locally decrypt the vault via its recovery slot, then
// re-encrypt it under a new password with a freshly rotated recovery code.
export function useRecoverLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<VerifyPhase>("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ephemeral, in-memory results of a successful verify — never persisted.
  const unlockedRef = useRef<UnlockedVault | null>(null);
  const recoveryAuthKeyRef = useRef<string | null>(null);
  // The exact email+code pair the current "valid" phase was verified against. A
  // verify binds the vault and recoveryAuthKey to one specific account, so the
  // guard must include the email — otherwise editing the email leaves a stale
  // "valid" phase bound to the wrong account (submit then 401s confusingly).
  const verifiedKeyRef = useRef<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t("validation.emailRequired"))
          .refine(isValidEmail, t("validation.emailInvalid")),
        recoveryCode: z.string().min(1, t("validation.recoveryRequired")),
        newPassword: z
          .string()
          .min(1, t("validation.passwordRequired"))
          .min(PASSWORD_MIN_LENGTH, t("validation.passwordTooShort")),
      }),
    [t],
  );

  const form = useForm<RecoverValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", recoveryCode: "", newPassword: "" },
    mode: "onSubmit",
  });

  const email = form.watch("email");
  const recoveryCode = form.watch("recoveryCode");

  const verifyMutation = useMutation({
    mutationFn: async (input: { email: string; code: string }) => {
      const secret = recoverySecretFromCode(input.code);
      const recoveryAuthKey = await deriveRecoveryAuthKey(secret);
      const response = await recoverVerify({
        email: normalizeEmail(input.email),
        recoveryAuthKey,
      });
      if (!response.vault) {
        throw new Error("missing vault");
      }
      const unlocked = await unlockWithRecovery(fromBase64(response.vault), input.code);
      return { recoveryAuthKey, unlocked };
    },
    onSuccess: ({ recoveryAuthKey, unlocked }) => {
      recoveryAuthKeyRef.current = recoveryAuthKey;
      unlockedRef.current = unlocked;
      setPhase("valid");
    },
    onError: (error: unknown) => {
      unlockedRef.current = null;
      setPhase("idle");
      const status = getHttpStatus(error);
      if (status === 401) {
        setVerifyError(t("errors.recoveryInvalid"));
      } else if (status === 429) {
        setVerifyError(t("errors.rateLimited"));
      } else {
        setVerifyError(t("errors.vaultDecrypt"));
      }
    },
  });
  const verifyRef = useRef(verifyMutation.mutate);
  verifyRef.current = verifyMutation.mutate;

  // Auto-verify once the code looks complete and the email is valid. Guarded by
  // the last-verified email+code pair so a complete input fires the (rate-limited)
  // verify exactly once, and editing either field re-verifies (or, if the input is
  // no longer complete, resets back to the entry phase) — never leaving a stale
  // "valid" phase bound to a since-changed email.
  useEffect(() => {
    const verifyKey = `${normalizeEmail(email)}:${normalizeRecovery(recoveryCode)}`;
    if (looksLikeRecoveryCode(recoveryCode) && isValidEmail(email)) {
      if (verifiedKeyRef.current !== verifyKey && !verifyMutation.isPending) {
        verifiedKeyRef.current = verifyKey;
        setVerifyError(null);
        setPhase("verifying");
        verifyRef.current({ email, code: recoveryCode });
      }
    } else if (phase !== "idle") {
      setPhase("idle");
      unlockedRef.current = null;
      verifiedKeyRef.current = null;
    }
  }, [recoveryCode, email, phase, verifyMutation.isPending]);

  const resetMutation = useMutation({
    mutationFn: async (values: RecoverValues) => {
      const unlocked = unlockedRef.current;
      const currentRecoveryAuthKey = recoveryAuthKeyRef.current;
      if (!unlocked || !currentRecoveryAuthKey) {
        throw new Error("vault not unlocked");
      }
      const normalizedEmail = normalizeEmail(values.email);
      const resealed = await reEncrypt(unlocked, values.newPassword);
      const newMasterKey = await deriveMasterKey(values.newPassword, normalizedEmail);
      const newAuthKey = await deriveAuthKey(newMasterKey);
      const newSecret = recoverySecretFromCode(resealed.recoveryCode);
      const newRecoveryAuthKey = await deriveRecoveryAuthKey(newSecret);

      const response = await recoverReset({
        email: normalizedEmail,
        recoveryAuthKey: currentRecoveryAuthKey,
        newAuthKey,
        newRecoveryAuthKey,
        vault: toBase64(resealed.blob),
      });
      return { response, newCode: resealed.recoveryCode, vault: resealed.vault };
    },
    onSuccess: async ({ response, newCode, vault }) => {
      setVaultSession(vault);
      if (response.tokens?.accessToken) {
        await establishSession(response.tokens.accessToken, response.user);
      }
      setPendingRecoveryCode(newCode);
      void navigate({ to: "/welcome/recovery-code" });
    },
    onError: (error: unknown) => {
      const status = getHttpStatus(error);
      if (status === 401) {
        setSubmitError(t("errors.recoveryInvalid"));
      } else if (status === 429) {
        setSubmitError(t("errors.rateLimited"));
      } else {
        setSubmitError(t("errors.generic"));
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    if (phase !== "valid") {
      setSubmitError(t("errors.recoveryInvalid"));
      return;
    }
    resetMutation.mutate(values);
  });

  return {
    form,
    onSubmit,
    phase,
    verifyError,
    submitError,
    isVerifying: verifyMutation.isPending,
    isSubmitting: resetMutation.isPending,
    canSubmit: phase === "valid",
  };
}
