import { createFileRoute } from "@tanstack/react-router";
import { requireVault } from "@/auth/guards";
import { ProjectDetailPage } from "@/pages/ProjectDetail";

// A single project: members + roles, invites, and the read-only shared host list.
// Client-only + vault-gated like the projects hub. The route reads the path param
// and hands it to the page as a prop, keeping the page router-independent (and so
// trivially testable).
export const Route = createFileRoute("/projects/$projectId")({
  ssr: false,
  beforeLoad: () => requireVault(),
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  return <ProjectDetailPage projectId={projectId} />;
}
