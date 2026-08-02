// OAuth login is a full-page navigation, not an XHR: the backend 302-redirects
// the browser to the provider's consent page, and the provider callback later
// sets the httpOnly refresh cookie and redirects back to /oauth/complete. So we
// send the browser to the authorize endpoint directly rather than fetching it.

import { API_BASE } from "@/api/axios-instance";
import { stashRedirect } from "./redirectTo";

// Absolute URL of a provider's authorize endpoint (relative when same-origin).
export function oauthAuthorizeUrl(provider: string): string {
  return `${API_BASE}/api/v1/auth/oauth/${provider}/authorize`;
}

// beginOAuth navigates the whole page to the provider consent screen.
//
// Any pending destination is stashed first: the browser is about to leave our
// origin for the backend and the provider, so a ?redirect= in the current URL
// would not come back with it.
export function beginOAuth(provider: string): void {
  const current = new URLSearchParams(globalThis.location.search).get("redirect");
  stashRedirect(current ?? undefined);
  globalThis.location.href = oauthAuthorizeUrl(provider);
}
