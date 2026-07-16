import { createFileRoute } from "@tanstack/react-router";
import { requireVault } from "@/auth/guards";
import { ProjectsPage } from "@/pages/Projects";

// The team-workspaces hub. Client-only (it does client-side crypto) and gated on
// a signed-in account with a vault; when the vault is locked the page shows the
// in-place unlock panel (LockedVaultPanel), mirroring the connections hub.
export const Route = createFileRoute("/projects")({
  ssr: false,
  beforeLoad: () => requireVault(),
  component: ProjectsPage,
});
