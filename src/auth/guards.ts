// Route access guards for TanStack Router `beforeLoad`. Per REACT.md/AUTH.md,
// access control lives here — never inside page components. They run after the
// root route's beforeLoad has awaited the silent-refresh bootstrap, so the
// access token reflects the resolved session.
//
// On the server the token is always absent (it is client-only), so guards defer
// entirely to the client pass rather than issuing a misleading redirect.

import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/api/wharf";
import { queryClient } from "@/queryClient";
import { ME_QUERY_KEY } from "./profile";
import { getAccessToken } from "./tokenStore";

const isClient = typeof window !== "undefined";

export function requireAuth(): void {
  if (!isClient) return;
  if (!getAccessToken()) {
    throw redirect({ to: "/signin" });
  }
}

export function requireAnonymous(): void {
  if (!isClient) return;
  if (getAccessToken()) {
    throw redirect({ to: "/device" });
  }
}

// requireVault gates signed-in screens that assume the account's vault exists
// (e.g. device pairing): an OAuth account that hasn't finished onboarding
// (hasVault=false) is sent to set-master-password instead. The profile is read
// through the shared ME cache so repeated navigations don't refetch; a failed
// profile read fails open (requireAuth has already passed and the screens
// themselves don't hard-depend on the flags).
export async function requireVault(): Promise<void> {
  if (!isClient) return;
  requireAuth();
  let hasVault: boolean | undefined;
  try {
    const me = await queryClient.ensureQueryData({
      queryKey: ME_QUERY_KEY,
      queryFn: getCurrentUser,
    });
    hasVault = me.hasVault;
  } catch {
    return;
  }
  if (hasVault === false) {
    throw redirect({ to: "/set-password" });
  }
}
