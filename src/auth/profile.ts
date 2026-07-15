// Shared React Query key for the signed-in account's /users/me profile (with
// its hasPassword / hasRecovery / hasVault routing flags). One key so the OAuth
// completion screen, the set-password onboarding and the vault route guard all
// read/update the same cache entry.

export const ME_QUERY_KEY = ["me"] as const;
