import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/Landing";

// Public landing page. Unlike the auth routes it is server-rendered (no
// `ssr: false`) — it has no client-side crypto and benefits from SSR for SEO and
// first paint. No guard: the landing is public for signed-in and anonymous users
// alike.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "wharf — your fleet, one terminal" },
      {
        name: "description",
        content:
          "An SSH manager that lives in your terminal — hosts, keys and projects synced across devices, shared with your team, and readable by no one but you.",
      },
    ],
  }),
  component: LandingPage,
});
