import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { AccountPage } from "@/pages/Account";

export const Route = createFileRoute("/account")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: AccountPage,
});
