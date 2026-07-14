import { createFileRoute } from "@tanstack/react-router";
import { requireAnonymous } from "@/auth/guards";
import { RecoverPage } from "@/pages/Recover";

export const Route = createFileRoute("/recover")({
  ssr: false,
  beforeLoad: () => requireAnonymous(),
  component: RecoverPage,
});
