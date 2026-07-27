// The two categories of mail wharf sends, as data.
//
// Security notices are listed here but have no key: there is nothing to send to
// the server for them, which is the whole point. The backend has no column and
// no enum constant for them either, so a request naming one is rejected — this
// list is a description of that fact, not the thing enforcing it.

// Stable keys, matching the backend's NotificationPreference enum. Never
// renamed: they are persisted, and they appear in the PATCH payload.
export const COLLABORATION_KEYS = [
  "projectInvite",
  "inviteAccepted",
  "inviteDeclined",
  "projectAccessGranted",
  "projectAccessRemoved",
  "roleChanged",
  "projectDeleted",
] as const;

export type CollaborationKey = (typeof COLLABORATION_KEYS)[number];

// Every collaboration notification is on unless the account says otherwise, so
// an unknown or not-yet-loaded key reads as on rather than flashing "off".
export const DEFAULT_PREFERENCES: Record<CollaborationKey, boolean> = Object.fromEntries(
  COLLABORATION_KEYS.map((key) => [key, true]),
) as Record<CollaborationKey, boolean>;

// i18n suffixes for the locked security notices, in the order they are shown.
// No keys — see above.
export const SECURITY_NOTICES = [
  "recoveryCodeUsed",
  "passwordChanged",
  "passwordSet",
  "devicePaired",
  "providerLinked",
  "accountDeleted",
] as const;

export type SecurityNotice = (typeof SECURITY_NOTICES)[number];

export function isCollaborationKey(key: string): key is CollaborationKey {
  return (COLLABORATION_KEYS as readonly string[]).includes(key);
}

// Reads the server's loosely-typed map back into the exact seven keys the UI
// renders. Anything the server does not mention keeps its default of on, so a
// key added server-side before the UI knows about it cannot render as off.
export function toPreferences(
  raw: Record<string, boolean> | undefined,
): Record<CollaborationKey, boolean> {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  const result = { ...DEFAULT_PREFERENCES };
  for (const key of COLLABORATION_KEYS) {
    if (typeof raw[key] === "boolean") result[key] = raw[key];
  }
  return result;
}
