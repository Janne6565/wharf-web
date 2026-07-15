import { useQuery } from "@tanstack/react-query";
import { listOAuthProviders } from "@/api/wharf";
import { beginOAuth } from "@/auth/oauth";

// Provider slugs the UI knows how to render, in display order.
export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

// Queries the backend for the OAuth providers it has configured. A provider's
// button is enabled iff its slug is in the list; when absent it stays disabled
// ("coming soon"). The pages that render this are ssr:false, so this only runs
// client-side. Failures resolve to no providers (all disabled).
export function useOAuthButtonsLogic() {
  const query = useQuery({
    queryKey: ["oauth-providers"],
    queryFn: listOAuthProviders,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const enabled = new Set(query.data?.providers ?? []);

  return {
    isEnabled: (provider: OAuthProvider) => enabled.has(provider),
    connect: (provider: OAuthProvider) => beginOAuth(provider),
  };
}
