import { createFileRoute } from "@tanstack/react-router";
import { DatenschutzPage } from "@/pages/Datenschutz";

// Public privacy notice. Server-rendered like the landing page (no `ssr: false`):
// a Datenschutzerklärung has to be reachable without JS and crawlable. Title and
// description are German because the page is — it is a German legal document.
export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung — wharf" },
      {
        name: "description",
        content: "Datenschutzerklärung: welche Daten wharf verarbeitet und warum.",
      },
    ],
  }),
  component: DatenschutzPage,
});
