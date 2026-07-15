import { createFileRoute } from "@tanstack/react-router";
import { OAuthCompletePage } from "@/pages/OAuthComplete";

// Landing spot of the backend's OAuth callback redirect. No auth guard: with
// ?error= it renders the failure card to an anonymous visitor, and without it
// the page itself performs the cookie → access-token bootstrap.
export const Route = createFileRoute("/oauth/complete")({
  ssr: false,
  validateSearch: (search) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: OAuthCompleteRoute,
});

function OAuthCompleteRoute() {
  const { error } = Route.useSearch();
  return <OAuthCompletePage error={error} />;
}
