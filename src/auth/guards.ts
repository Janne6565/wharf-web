// Route access guards for TanStack Router `beforeLoad`. Per REACT.md/AUTH.md,
// access control lives here — never inside page components. They run after the
// root route's beforeLoad has awaited the silent-refresh bootstrap, so the
// access token reflects the resolved session.
//
// On the server the token is always absent (it is client-only), so guards defer
// entirely to the client pass rather than issuing a misleading redirect.

import { redirect } from "@tanstack/react-router";
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
