// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

// The page uses TanStack's <Link>, which needs a router context; stub it with a
// plain anchor so the page renders in isolation (mirrors Impressum.test).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

import { DatenschutzPage } from "./index";
import { HOSTING_PROVIDER } from "./lib";

afterEach(() => vi.clearAllMocks());

// Release guard. Naming the processor that stores the data is required by
// Art. 13 Abs. 1 lit. e DSGVO, so the notice is legally incomplete without it.
// The provider is filled in now; this keeps it from regressing to a stand-in,
// and requires the entry to actually identify a company and a country rather
// than being a bare name.
describe("Datenschutz release guard", () => {
  const missing =
    'INCOMPLETE: the hosting provider in section 6 ("Empfänger und Drittanbieter"). ' +
    "HOSTING_PROVIDER in src/pages/Datenschutz/lib.ts must name the processor's " +
    "company, address and country. The Datenschutzerklärung must not be deployed otherwise.";

  it("names a real hosting provider, not a placeholder", () => {
    expect(HOSTING_PROVIDER, missing).not.toMatch(/noch zu ergänzen|TODO|TBD|\[|\]/);
  });

  it("identifies the processor by company and country", () => {
    expect(HOSTING_PROVIDER, missing).toMatch(/GmbH|Inc\.|Ltd|SE|AG/);
    expect(HOSTING_PROVIDER, missing).toMatch(/Deutschland|Germany|EU/);
  });
});

describe("DatenschutzPage", () => {
  it("renders the heading and the controller block", () => {
    renderWithProviders(<DatenschutzPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Datenschutzerklärung" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "1. Verantwortlicher" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Janne Keipert")).toBeInTheDocument();
    expect(screen.getByText("Marchlewskistraße 102")).toBeInTheDocument();
    expect(screen.getByText("10243 Berlin")).toBeInTheDocument();
    expect(screen.getByText("Deutschland")).toBeInTheDocument();
  });

  it("renders every numbered section heading in order", () => {
    renderWithProviders(<DatenschutzPage />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "1. Verantwortlicher",
      "2. Grundsatz: Der Server kann deine Daten nicht lesen",
      "3. Welche Daten verarbeitet werden",
      "4. Zwecke und Rechtsgrundlagen",
      "5. Cookies und Reichweitenmessung",
      "6. Empfänger und Drittanbieter",
      "7. Speicherdauer",
      "8. Löschung des Kontos",
      "9. Deine Rechte",
    ]);
  });

  it("exposes the controller's address as a mailto link", () => {
    renderWithProviders(<DatenschutzPage />);
    const links = screen.getAllByRole("link", { name: "jabbekeipert@gmail.com" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "mailto:jabbekeipert@gmail.com");
    }
  });

  it("states the zero-knowledge principle", () => {
    renderWithProviders(<DatenschutzPage />);
    expect(screen.getByText(/das Master-Passwort verlässt dein Gerät nie/)).toBeInTheDocument();
    expect(screen.getByText(/ohne ihn entschlüsseln zu können/)).toBeInTheDocument();
  });

  it("cites the legal bases from Art. 6 DSGVO", () => {
    renderWithProviders(<DatenschutzPage />);
    expect(screen.getAllByText(/Art\. 6 Abs\. 1 lit\. b DSGVO/).length).toBe(2);
    // Section 4 (Missbrauchsschutz) and section 8 (Sicherungskopien).
    expect(screen.getAllByText(/Art\. 6 Abs\. 1 lit\. f DSGVO/).length).toBe(2);
  });

  // Backups outlive an account deletion by up to 60 days, so section 8 claiming a
  // deletion is simply final would understate the retention. Keep the disclosure and
  // its retention figure in step with strata.backup.retention-tiers.
  it("discloses that backups retain deleted data for a bounded period", () => {
    renderWithProviders(<DatenschutzPage />);
    expect(screen.getByText(/Sicherungskopien \(Backups\) der Datenbank/)).toBeInTheDocument();
    expect(screen.getByText(/längstens 60 Tage enthalten sein/)).toBeInTheDocument();
  });

  it("offers a back link to the landing page", () => {
    renderWithProviders(<DatenschutzPage />);
    expect(screen.getByTestId("datenschutz-back")).toHaveAttribute("to", "/");
  });
});
