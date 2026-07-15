import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getCurrentUser } from "@/api/wharf";
import { ME_QUERY_KEY } from "@/auth/profile";
import { ensureSessionBootstrapped } from "@/auth/session";
import { getAccessToken } from "@/auth/tokenStore";

// Error codes the backend appends as ?error=<code> when the OAuth callback fails.
export const OAUTH_ERROR_CODES = [
  "provider_disabled",
  "invalid_state",
  "email_not_verified",
  "provider_error",
  "server_error",
] as const;
export type OAuthErrorCode = (typeof OAUTH_ERROR_CODES)[number] | "generic";

// Maps a raw ?error= value to a known i18n key, falling back to "generic".
export function toOAuthErrorCode(raw: string): OAuthErrorCode {
  return (OAUTH_ERROR_CODES as readonly string[]).includes(raw)
    ? (raw as OAuthErrorCode)
    : "generic";
}

// Drives the /oauth/complete landing screen. The provider callback has already
// set the httpOnly refresh cookie, so we reuse the standard silent-refresh
// bootstrap to obtain an access token (no second token path), then read the
// account's capability flags to decide where to send the user:
//   hasVault === false → set a master password (first-time OAuth onboarding)
//   hasVault === true  → unlock the existing vault
// A missing error param + a failed refresh is treated as a server_error.
export function useOAuthCompleteLogic(errorParam: string | undefined) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    enabled: !errorParam,
    retry: false,
    queryFn: async () => {
      await ensureSessionBootstrapped();
      if (!getAccessToken()) {
        // The refresh cookie was missing or invalid — nothing to sign in with.
        throw new Error("no-session");
      }
      return getCurrentUser();
    },
  });

  const profile = query.data;

  useEffect(() => {
    if (!profile) return;
    void navigate({ to: profile.hasVault ? "/unlock" : "/set-password" });
  }, [profile, navigate]);

  const errorCode: OAuthErrorCode | null = errorParam
    ? toOAuthErrorCode(errorParam)
    : query.isError
      ? "server_error"
      : null;

  return { errorCode };
}
