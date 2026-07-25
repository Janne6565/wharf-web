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
import { getVaultSession } from "@/auth/vaultSession";
import { deriveAuthKey, deriveMasterKey, normalizeEmail } from "@/crypto";
import { parseVaultDocument, type VaultIdentity } from "@/lib/vaultDocument";
import { loadProjectHostCounts, type ProjectHostCounts } from "./projectHostCounts";

const DELETION_PREVIEW_KEY = ["accountDeletionPreview"] as const;
const PROJECT_HOSTS_KEY = "accountDeletionProjectHosts";

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

// What the local vault holds, counted for the warning. Null means the vault is
// locked on this device: the numbers are then genuinely unknowable and must be
// rendered as such rather than as zeros, which would understate the loss.
export interface VaultContents {
  readonly hosts: number;
  readonly keys: number;
  readonly passwords: number;
}

interface DeleteAccountValues {
  email: string;
  password: string;
}

// The account's X25519 identity, read straight from the unlocked personal
// vault. Undefined when the vault is locked or holds no identity yet — in which
// case no project vault can be opened, and the host counts stay unknown. This
// deliberately does NOT run the identity bootstrap: a confirmation dialog must
// not mint or publish keys as a side effect.
function readVaultIdentity(): VaultIdentity | undefined {
  const session = getVaultSession();
  if (!session) return undefined;
  try {
    return parseVaultDocument(session.payload).identity;
  } catch {
    return undefined;
  }
}

// Counts read from the in-memory vault, or null when it is locked or the
// payload cannot be parsed. Counting is all this does — the parser exposes no
// key material and no password values (see lib/vaultDocument.ts).
function readVaultContents(): VaultContents | null {
  const session = getVaultSession();
  if (!session) return null;
  try {
    const doc = parseVaultDocument(session.payload);
    return { hosts: doc.hosts.length, keys: doc.keyCount, passwords: doc.storedPasswordCount };
  } catch {
    return null;
  }
}

// Owns the account-deletion confirmation: the preview of what gets destroyed,
// which of the two confirmation variants applies, the typed-email friction
// gate, the authKey derivation (identical to sign-in) and the tear-down on
// success.
export function useDeleteAccountLogic(open: boolean) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { email: sessionEmail } = useAuthInformation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Both reads are deferred until the dialog opens — the account screen itself
  // needs neither.
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

  // The vault lives in module state rather than React state, so it is read once
  // per opening of the dialog.
  const vaultContents = useMemo(() => (open ? readVaultContents() : null), [open]);

  // Per-project host counts, fetched and decrypted client-side. Deliberately a
  // separate query: it is slower than the preview, it is allowed to fail, and
  // the dialog stays fully usable (and submittable) while it resolves.
  const identity = useMemo(() => (open ? readVaultIdentity() : undefined), [open]);
  const ownedIds = (preview?.ownedProjects ?? []).map((project) => project.id);
  const hostCountsQuery = useQuery({
    queryKey: [PROJECT_HOSTS_KEY, ownedIds],
    queryFn: () =>
      identity
        ? loadProjectHostCounts(ownedIds, identity)
        : Promise.resolve({} as ProjectHostCounts),
    enabled: open && identity !== undefined && ownedIds.length > 0,
    retry: false,
  });

  // The calm variant is only for an account with genuinely nothing to lose. Any
  // uncertainty — preview still loading, preview failed, vault locked — falls
  // back to the full variant with the typed-email gate. Erring that way only
  // costs the user some typing; erring the other way would let them delete real
  // data behind a single click.
  const vaultKnownEmpty =
    vaultContents !== null &&
    vaultContents.hosts === 0 &&
    vaultContents.keys === 0 &&
    vaultContents.passwords === 0;
  const nothingToLose =
    preview !== null &&
    preview.ownedProjects.length === 0 &&
    preview.otherMemberships === 0 &&
    vaultKnownEmpty;
  const requiresEmailConfirmation = !nothingToLose;

  const schema = useMemo(
    () =>
      z.object({
        email: requiresEmailConfirmation
          ? z
              .string()
              .refine(
                (value) => value.trim() === email,
                t("deleteAccount.validation.emailMismatch"),
              )
          : z.string(),
        password: z.string(),
      }),
    [email, requiresEmailConfirmation, t],
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
      // Leave the guarded screen *before* tearing the session down, so no
      // guarded screen ever renders against a dead session.
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

  return {
    form,
    onSubmit,
    email,
    hasPassword,
    preview,
    previewLoading: previewQuery.isLoading,
    previewFailed: previewQuery.isError,
    ownedProjectCount: preview?.ownedProjects.length ?? 0,
    // projectId -> host count. A missing entry means "not known" (still
    // loading, vault locked, or that project could not be opened) and renders
    // as no number at all — never as zero.
    projectHostCounts: hostCountsQuery.data ?? {},
    // Null while the vault is locked: the warning then says what is destroyed
    // without pretending to know how much of it there is.
    vaultContents,
    // Picks the confirmation variant, and with it the typed-email gate.
    nothingToLose,
    requiresEmailConfirmation,
    submitError,
    isDeleting: mutation.isPending,
    // Deliberate friction: in the full variant the address must be typed out
    // exactly before the destructive action arms at all.
    canSubmit:
      email.length > 0 &&
      (!requiresEmailConfirmation || typedEmail.trim() === email) &&
      (!hasPassword || password.length > 0),
  };
}
