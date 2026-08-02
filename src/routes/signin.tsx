import { createFileRoute } from "@tanstack/react-router";
import { requireAnonymous } from "@/auth/guards";
import { safeRedirect } from "@/auth/redirectTo";
import { SigninPage } from "@/pages/Signin";

// `redirect` is where a guard bounced the visitor from — validated on the way
// in, so a hostile value in the URL never reaches a navigate().
interface SigninSearch {
  readonly redirect?: string;
}

export const Route = createFileRoute("/signin")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SigninSearch => ({
    redirect: safeRedirect(search.redirect),
  }),
  beforeLoad: ({ search }) => requireAnonymous(search.redirect),
  component: SigninPage,
});
