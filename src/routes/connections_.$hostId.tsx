import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { HostDetailPage } from "@/pages/HostDetail";

// One stored connection, read-only. A sibling of /connections rather than a
// child (the trailing underscore): the hub renders no <Outlet>, so nesting it
// would silently render the hub instead of this page.
export const Route = createFileRoute("/connections_/$hostId")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  const { hostId } = Route.useParams();
  return <HostDetailPage hostId={hostId} />;
}
