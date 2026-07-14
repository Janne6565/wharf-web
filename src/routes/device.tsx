import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/auth/guards";
import { DevicePage } from "@/pages/Device";

export const Route = createFileRoute("/device")({
  ssr: false,
  beforeLoad: () => requireAuth(),
  component: DevicePage,
});
