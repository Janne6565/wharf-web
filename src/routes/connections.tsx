import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { ConnectionsPage } from "@/pages/Connections";

export const Route = createFileRoute("/connections")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: ConnectionsPage,
});
