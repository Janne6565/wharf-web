import { createFileRoute } from "@tanstack/react-router";
import { requireAnonymous } from "@/auth/guards";
import { SigninPage } from "@/pages/Signin";

export const Route = createFileRoute("/signin")({
  ssr: false,
  beforeLoad: () => requireAnonymous(),
  component: SigninPage,
});
