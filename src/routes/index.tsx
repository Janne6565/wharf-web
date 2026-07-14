import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken } from "@/auth/tokenStore";

// Root redirect: authed -> /device, otherwise -> /signin. Client-only, so the
// decision runs after the root's silent-refresh bootstrap has resolved.
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    throw redirect({ to: getAccessToken() ? "/device" : "/signin" });
  },
});
