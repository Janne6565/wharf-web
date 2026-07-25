import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPendingVerificationEmail } from "@/auth/verificationHandoff";
import { VerifyEmailPage } from "@/pages/VerifyEmail";

// `email` lets a blocked sign-in deep-link straight into this screen; the
// onboarding flow arrives without it and reads the address from the in-memory
// handoff instead.
interface VerifyEmailSearch {
  readonly email?: string;
}

// No auth guard: verification is what *creates* the session, so the visitor is
// necessarily anonymous here. What must exist is an address to verify — without
// one (a reload that lost the handoff, or a bare direct visit) there is nothing
// to show, so send the user to sign in.
export const Route = createFileRoute("/welcome/verify-email")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (typeof window !== "undefined" && !search.email && !getPendingVerificationEmail()) {
      throw redirect({ to: "/signin" });
    }
  },
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { email } = Route.useSearch();
  return <VerifyEmailPage email={email} />;
}
