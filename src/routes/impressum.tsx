import { createFileRoute } from "@tanstack/react-router";
import { ImpressumPage } from "@/pages/Impressum";

// Public legal notice. Server-rendered like the landing page (no `ssr: false`):
// an Impressum has to be reachable without JS and crawlable. Title and
// description are German because the page is — it is a German legal document.
export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — wharf" },
      { name: "description", content: "Impressum und Anbieterkennzeichnung gemäß § 5 DDG." },
    ],
  }),
  component: ImpressumPage,
});
