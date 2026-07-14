// A one-shot in-memory handoff for the freshly generated recovery code between
// the sign-up / reset step and the "Save your recovery code" screen. The code
// (and the secret it decodes to) is NEVER persisted — it lives only here, in
// memory, so a page reload or direct navigation loses it and the guard bounces
// the user back. This mirrors "shown once, right now — we keep no readable copy".

let pendingRecoveryCode: string | null = null;

export function setPendingRecoveryCode(code: string): void {
  pendingRecoveryCode = code;
}

export function getPendingRecoveryCode(): string | null {
  return pendingRecoveryCode;
}

export function clearPendingRecoveryCode(): void {
  pendingRecoveryCode = null;
}
