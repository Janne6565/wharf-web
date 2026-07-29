import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { HostDetailPage } from "@/pages/HostDetail";

// One stored connection, read-only. A sibling of /connections rather than a
// child (the trailing underscore): the hub renders no <Outlet>, so nesting it
// would silently render the hub instead of this page.
//
// ?project=<id> marks a shared host: host ids are unique only within one vault,
// so it says which project blob to look in. Absent = the personal vault.
export const Route = createFileRoute("/connections_/$hostId")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { project?: string } =>
    typeof search.project === "string" && search.project.length > 0
      ? { project: search.project }
      : {},
  beforeLoad: () => requireAuth(),
  component: RouteComponent,
});

function RouteComponent() {
  const { hostId } = Route.useParams();
  const { project } = Route.useSearch();
  return <HostDetailPage hostId={hostId} projectId={project} />;
}
