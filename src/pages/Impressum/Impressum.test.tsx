// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

// The page uses TanStack's <Link>, which needs a router context; stub it with a
// plain anchor so the page renders in isolation (mirrors Landing.test).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

import { ImpressumPage } from "./index";

afterEach(() => vi.clearAllMocks());

describe("ImpressumPage", () => {
  it("renders the statutory provider block with name and address", () => {
    renderWithProviders(<ImpressumPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Impressum" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Angaben gemäß § 5 DDG" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Janne Keipert").length).toBeGreaterThan(0);
    expect(screen.getByText("Marchlewskistraße 102")).toBeInTheDocument();
    expect(screen.getByText("10243 Berlin")).toBeInTheDocument();
    expect(screen.getByText("Deutschland")).toBeInTheDocument();
  });

  it("exposes the contact address as a mailto link", () => {
    renderWithProviders(<ImpressumPage />);
    expect(screen.getByRole("link", { name: "jabbekeipert@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:jabbekeipert@gmail.com",
    );
  });

  it("renders the remaining statutory sections", () => {
    renderWithProviders(<ImpressumPage />);
    for (const heading of [
      "Kontakt",
      "Umsatzsteuer",
      "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
      "Haftung für Inhalte",
      "Haftung für Links",
      "Urheberrecht",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/§ 19 Abs. 1 UStG/)).toBeInTheDocument();
  });

  it("offers a back link to the landing page", () => {
    renderWithProviders(<ImpressumPage />);
    expect(screen.getByTestId("back-link")).toHaveAttribute("to", "/");
  });
});
