// Fetches the encrypted vault and unlocks it client-side with the master
// password, priming it in memory for the session. Shared by Sign-in (best-effort
// after login) and the OAuth Unlock screen (where a wrong password must surface
// an error). A wrong password throws a CryptoError ("wrong-secret").

import { getVault } from "@/api/wharf";
import { fromBase64, unlockWithPassword } from "@/crypto";
import { setVaultSession } from "./vaultSession";

// Returns true when a vault existed and is now primed; false when the account
// has no vault blob yet (a fresh OAuth account that skipped onboarding).
export async function unlockVaultWithPassword(password: string): Promise<boolean> {
  const vaultResponse = await getVault();
  if (!vaultResponse.vault) {
    return false;
  }
  const unlocked = await unlockWithPassword(fromBase64(vaultResponse.vault), password);
  setVaultSession(unlocked);
  return true;
}
