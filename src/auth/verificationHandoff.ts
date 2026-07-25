// A one-shot in-memory handoff for the address awaiting email verification,
// carried from sign-up through the recovery-code screen to "verify your email".
// Registration no longer establishes a session, so there is no signed-in user to
// read the address from — and it is deliberately not persisted: a reload loses
// it and the screen falls back to the ?email= search param (a blocked sign-in
// deep-links with it) or bounces to /signin. Mirrors recoveryHandoff.ts.

let pendingVerificationEmail: string | null = null;

export function setPendingVerificationEmail(email: string): void {
  pendingVerificationEmail = email;
}

export function getPendingVerificationEmail(): string | null {
  return pendingVerificationEmail;
}

export function clearPendingVerificationEmail(): void {
  pendingVerificationEmail = null;
}
