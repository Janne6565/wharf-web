import { createFileRoute } from "@tanstack/react-router";
import { requireVault } from "@/auth/guards";
import { DevicePage } from "@/pages/Device";

// Pairing a terminal only makes sense once a vault exists — a vault-less OAuth
// account is redirected to set-master-password by the guard.
export const Route = createFileRoute("/device")({
  ssr: false,
  beforeLoad: () => requireVault(),
  component: DevicePage,
});
