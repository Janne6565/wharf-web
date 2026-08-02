import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { UserProfile } from "@/api/generated/model";
import { getHttpStatus } from "@/api/httpError";
import { getCurrentUser, setupAccount } from "@/api/wharf";
import { ME_QUERY_KEY } from "@/auth/profile";
import { setPendingRecoveryCode } from "@/auth/recoveryHandoff";
import { buildOnboardingVault } from "@/auth/vaultOnboarding";
import { setVaultSession } from "@/auth/vaultSession";
import { toBase64 } from "@/crypto";
import { PASSWORD_MIN_LENGTH } from "@/lib/validators";

interface SetPasswordValues {
  password: string;
  confirm: string;
  understand: boolean;
}

// First-time onboarding for an OAuth account: set a master password, which
// derives the same keys and vault as classic sign-up (reusing buildOnboardingVault
// exactly), then atomically registers them via /auth/setup. The email comes from
// /users/me — the account already exists — so there is no email field. On success
// the one-time recovery code is handed to the recovery-code screen.
export function useSetPasswordLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect: pendingRedirect } = useSearch({ strict: false }) as { redirect?: string };
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // The account's email (for key derivation) and its capability flags. If the
  // vault already exists (e.g. a reload after setup), route forward instead.
  const profile = useQuery({ queryKey: ME_QUERY_KEY, queryFn: getCurrentUser, retry: false });

  // Set once this screen has routed onwards itself. Our own success handler
  // flips hasVault in the profile cache, which re-runs the effect below — without
  // this latch it would immediately overrule the navigation to the recovery-code
  // screen and the one-time code would never be shown.
  const routedRef = useRef(false);

  useEffect(() => {
    if (profile.data?.hasVault && !routedRef.current) {
      routedRef.current = true;
      void navigate({
        to: "/unlock",
        search: pendingRedirect ? { redirect: pendingRedirect } : undefined,
      });
    }
  }, [profile.data, navigate, pendingRedirect]);

  const schema = useMemo(
    () =>
      z
        .object({
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

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "", understand: false },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (values: SetPasswordValues) => {
      const email = profile.data?.email;
      if (!email) {
        throw new Error("missing-profile-email");
      }
      const { authKey, recoveryAuthKey, blob, recoveryCode, vault } = await buildOnboardingVault(
        email,
        values.password,
      );
      // authKey enables classic email+password login alongside OAuth.
      await setupAccount({ recoveryAuthKey, vault: toBase64(blob), authKey });
      return { recoveryCode, vault };
    },
    onSuccess: ({ recoveryCode, vault }) => {
      setVaultSession(vault);
      setPendingRecoveryCode(recoveryCode);
      // Flip the cached capability flags so the vault route guard doesn't
      // bounce the freshly onboarded account back here from stale data.
      queryClient.setQueryData<UserProfile>(ME_QUERY_KEY, (old) =>
        old ? { ...old, hasPassword: true, hasRecovery: true, hasVault: true } : old,
      );
      routedRef.current = true;
      void navigate({ to: "/welcome/recovery-code" });
    },
    onError: async (error: unknown) => {
      // 409 means the account was already set up (recovery/vault exist) — a
      // duplicate or racing submit. Re-read the profile and route forward.
      if (getHttpStatus(error) === 409) {
        try {
          const me = await getCurrentUser();
          queryClient.setQueryData<UserProfile>(ME_QUERY_KEY, me);
          routedRef.current = true;
          void navigate({ to: me.hasVault ? "/unlock" : (pendingRedirect ?? "/device") });
          return;
        } catch {
          // Fall through to a generic error if the re-check fails.
        }
      }
      const status = getHttpStatus(error);
      if (status === 429) {
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
  const confirm = form.watch("confirm");
  const understand = form.watch("understand");

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: mutation.isPending,
    ready: Boolean(profile.data?.email),
    password,
    understand,
    setUnderstand: (checked: boolean) =>
      form.setValue("understand", checked, { shouldValidate: form.formState.isSubmitted }),
    canSubmit: password.length > 0 && confirm.length > 0 && understand,
  };
}
