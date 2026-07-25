// Session lifecycle glue: turns an access token (from register / login / device
// bootstrap) into UI auth state, and runs the one-time silent refresh on app
// load. All strictly client-side — no secret ever flows through server code.

import { getCurrentUser, refreshSession } from "@/api/wharf";
import { store } from "@/store";
import {
  type AuthUser,
  sessionCleared,
  sessionEstablished,
  sessionResolvedAnonymous,
} from "./authSlice";
import { decodeIdentityToken } from "./jwt";
import { clearAccessToken, setAccessToken } from "./tokenStore";
import { clearVaultSession, forgetHostCount } from "./vaultSession";

// establishSession stores the access token and publishes the signed-in user to
// Redux. Prefer the user object returned by the auth endpoint; otherwise read
// the token's claims, falling back to GET /users/me.
export async function establishSession(
  accessToken: string,
  user?: { id?: string; email?: string },
): Promise<void> {
  setAccessToken(accessToken);
  let resolved: AuthUser | null =
    user?.id && user.email ? { id: user.id, email: user.email } : null;
  if (!resolved) {
    const claims = decodeIdentityToken(accessToken);
    if (claims?.email && claims.userId) {
      resolved = { id: claims.userId, email: claims.email };
    } else {
      const me = await getCurrentUser();
      resolved = { id: me.id ?? "", email: me.email ?? "" };
    }
  }
  store.dispatch(sessionEstablished(resolved));
}

export function clearSession(): void {
  clearAccessToken();
  clearVaultSession();
  forgetHostCount();
  store.dispatch(sessionCleared());
}

let bootstrap: Promise<void> | null = null;

// ensureSessionBootstrapped attempts a single silent refresh via the httpOnly
// cookie. It is awaited in the root route's beforeLoad so route guards see a
// resolved auth state. It is a no-op on the server (the cookie/token are
// client-only concerns) and memoized so it runs at most once per page load.
export function ensureSessionBootstrapped(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (!bootstrap) {
    bootstrap = runBootstrap();
  }
  return bootstrap;
}

async function runBootstrap(): Promise<void> {
  try {
    const res = await refreshSession();
    if (res.accessToken) {
      await establishSession(res.accessToken);
      return;
    }
  } catch {
    // No valid refresh cookie — treat as anonymous. This also covers the 403
    // email_not_verified case (an account that never completed verification):
    // there is nothing to retry, so the app resolves to anonymous and the
    // guards send the visitor to sign in rather than looping on refresh.
  }
  store.dispatch(sessionResolvedAnonymous());
}
