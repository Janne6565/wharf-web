// Route access guards for TanStack Router `beforeLoad`. Per REACT.md/AUTH.md,
// access control lives here — never inside page components.
//
// Each guard awaits the silent-refresh bootstrap itself before reading the
// token. The root beforeLoad also runs it, but its result is dehydrated from
// SSR and does NOT re-run on initial client hydration — so on a hard reload of
// an ssr:false guarded route (e.g. /unlock) the token would still be absent at
// guard time and bounce an authenticated user to /signin. Awaiting the
// (memoized) bootstrap here makes the guard see the resolved session.
//
// On the server the token is always absent (it is client-only) and the refresh
// is a no-op, so guards defer entirely to the client pass.

import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/api/wharf";
import { queryClient } from "@/queryClient";
import { ME_QUERY_KEY } from "./profile";
import { ensureSessionBootstrapped } from "./session";
import { getAccessToken } from "./tokenStore";

const isClient = typeof window !== "undefined";

export async function requireAuth(): Promise<void> {
  if (!isClient) return;
  await ensureSessionBootstrapped();
  if (!getAccessToken()) {
    throw redirect({ to: "/signin" });
  }
}

export async function requireAnonymous(): Promise<void> {
  if (!isClient) return;
  await ensureSessionBootstrapped();
  if (getAccessToken()) {
    throw redirect({ to: "/connections" });
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
  await requireAuth();
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
