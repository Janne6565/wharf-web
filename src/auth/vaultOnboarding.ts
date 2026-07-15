// Shared client-side vault bootstrap used by both first-time flows: classic
// email+password sign-up and OAuth first-time onboarding (set master password).
// It composes the crypto primitives exactly the way Sign-up always has, so the
// vault blob, recovery code and derived keys are byte-identical across flows.
// The server only ever receives the derived keys and the opaque ciphertext.

import {
  createVault,
  deriveAuthKey,
  deriveMasterKey,
  deriveRecoveryAuthKey,
  initialVaultPayload,
  normalizeEmail,
  recoverySecretFromCode,
  type UnlockedVault,
} from "@/crypto";

export interface OnboardingVault {
  // base64 HKDF auth key (password credential) the server bcrypt-hashes.
  readonly authKey: string;
  // base64 HKDF auth key for the one-time recovery code.
  readonly recoveryAuthKey: string;
  // Raw WHARFV ciphertext blob (base64-encode at the call site before upload).
  readonly blob: Uint8Array;
  // The one-time recovery code, shown once on the next screen.
  readonly recoveryCode: string;
  // The unlocked vault (DEK + payload) to prime in memory after onboarding.
  readonly vault: UnlockedVault;
}

// buildOnboardingVault derives the password auth key, creates a fresh vault with
// a password slot + recovery slot, and derives the recovery auth key — the exact
// sequence used by Sign-up.
export async function buildOnboardingVault(
  email: string,
  password: string,
): Promise<OnboardingVault> {
  const normalized = normalizeEmail(email);
  const masterKey = await deriveMasterKey(password, normalized);
  const authKey = await deriveAuthKey(masterKey);

  const { blob, recoveryCode, vault } = await createVault(password, initialVaultPayload());
  const recoverySecret = recoverySecretFromCode(recoveryCode);
  const recoveryAuthKey = await deriveRecoveryAuthKey(recoverySecret);

  return { authKey, recoveryAuthKey, blob, recoveryCode, vault };
}
