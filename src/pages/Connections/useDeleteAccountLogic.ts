import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { getHttpStatus, getProblemCode, PROBLEM_CODES } from "@/api/httpError";
import { deleteAccount, getAccountDeletionPreview, getCurrentUser } from "@/api/wharf";
import { ME_QUERY_KEY } from "@/auth/profile";
import { clearSession } from "@/auth/session";
import { useAuthInformation } from "@/auth/useAuthInformation";
import { deriveAuthKey, deriveMasterKey, normalizeEmail } from "@/crypto";

const DELETION_PREVIEW_KEY = ["accountDeletionPreview"] as const;

// The preview with every field resolved — see the normalisation below.
export interface OwnedProjectImpact {
  readonly id: string;
  readonly name: string;
  // Members other than the owner who lose access when the project is deleted.
  readonly otherMemberCount: number;
}

export interface DeletionPreview {
  readonly ownedProjects: readonly OwnedProjectImpact[];
  // Projects the account is a member of but does not own; those survive.
  readonly otherMemberships: number;
}

interface DeleteAccountValues {
  email: string;
  password: string;
}

// Owns the account-deletion confirmation: the preview of what gets destroyed,
// the typed-email friction gate, the authKey derivation (identical to sign-in)
// and the tear-down on success.
export function useDeleteAccountLogic(open: boolean) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { email: sessionEmail } = useAuthInformation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Both reads are deferred until the dialog opens — the hub itself needs
  // neither.
  const profileQuery = useQuery({ queryKey: ME_QUERY_KEY, queryFn: getCurrentUser, enabled: open });
  const previewQuery = useQuery({
    queryKey: DELETION_PREVIEW_KEY,
    queryFn: getAccountDeletionPreview,
    enabled: open,
    retry: false,
  });

  const email = sessionEmail ?? profileQuery.data?.email ?? "";
  // An OAuth-only account has no password credential to re-prove; until the
  // profile resolves, assume there is one so the field never appears late.
  const hasPassword = profileQuery.data?.hasPassword !== false;

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .refine((value) => value.trim() === email, t("deleteAccount.validation.emailMismatch")),
        password: z.string(),
      }),
    [email, t],
  );

  const form = useForm<DeleteAccountValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (values: DeleteAccountValues) => {
      // Omitted entirely for an OAuth-only account: the backend accepts an absent
      // authKey only when there is no password hash to re-prove.
      let authKey: string | undefined;
      if (hasPassword) {
        const masterKey = await deriveMasterKey(values.password, normalizeEmail(email));
        authKey = await deriveAuthKey(masterKey);
      }
      await deleteAccount({ authKey });
    },
    onSuccess: async () => {
      // Leave the guarded hub *before* tearing the session down, so no guarded
      // screen ever renders against a dead session.
      await navigate({ to: "/" });
      // Drops the access token, the in-memory vault and the Redux session.
      clearSession();
    },
    onError: (error: unknown) => {
      const status = getHttpStatus(error);
      if (status === 401) {
        setSubmitError(t("deleteAccount.errors.wrongPassword"));
      } else if (getProblemCode(error) === PROBLEM_CODES.authKeyRequired) {
        setSubmitError(t("deleteAccount.errors.passwordRequired"));
      } else if (status === 429) {
        setSubmitError(t("errors.rateLimited"));
      } else {
        setSubmitError(t("deleteAccount.errors.generic"));
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    mutation.mutate(values);
  });

  const typedEmail = form.watch("email");
  const password = form.watch("password");
  // springdoc types every field of the generated preview as optional, so the
  // shape is pinned down once here rather than defended against in the JSX.
  const preview: DeletionPreview | null = previewQuery.data
    ? {
        ownedProjects: (previewQuery.data.ownedProjects ?? []).map((project) => ({
          id: project.id ?? "",
          name: project.name ?? "",
          otherMemberCount: project.otherMemberCount ?? 0,
        })),
        otherMemberships: previewQuery.data.otherMemberships ?? 0,
      }
    : null;
  const othersAffected =
    preview?.ownedProjects.reduce((sum, project) => sum + project.otherMemberCount, 0) ?? 0;

  return {
    form,
    onSubmit,
    email,
    hasPassword,
    preview,
    previewLoading: previewQuery.isLoading,
    previewFailed: previewQuery.isError,
    othersAffected,
    submitError,
    isDeleting: mutation.isPending,
    // Deliberate friction: the address must be typed out exactly before the
    // destructive action arms at all.
    canSubmit:
      email.length > 0 && typedEmail.trim() === email && (!hasPassword || password.length > 0),
  };
}
