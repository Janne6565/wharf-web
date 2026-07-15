import { createFileRoute } from "@tanstack/react-router";
import { requireVault } from "@/auth/guards";
import { DevicePage } from "@/pages/Device";

// `onboarding=true` marks arrivals from the signup/recover flow (the final "[3]
// connect device" step); it drives the step indicator and the back target. A
// returning user pairing a device from their connections omits it, so the
// onboarding chrome stays hidden and "back" leads to /connections.
interface DeviceSearch {
  readonly onboarding: boolean;
}

// Pairing a terminal only makes sense once a vault exists — a vault-less OAuth
// account is redirected to set-master-password by the guard.
export const Route = createFileRoute("/device")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): DeviceSearch => ({
    onboarding: search.onboarding === true || search.onboarding === "true",
  }),
  beforeLoad: () => requireVault(),
  component: DevicePage,
});
