import { createFileRoute } from "@tanstack/react-router";
import { requireAnonymous } from "@/auth/guards";
import { SignupPage } from "@/pages/Signup";

export const Route = createFileRoute("/signup")({
  ssr: false,
  beforeLoad: () => requireAnonymous(),
  component: SignupPage,
});
