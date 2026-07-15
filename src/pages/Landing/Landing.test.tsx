// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

// The landing nav uses TanStack's <Link>, which needs a router context; stub it
// with a plain anchor so the page renders in isolation (mirrors Signin.test).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

import { LandingPage } from "./index";

afterEach(() => vi.clearAllMocks());

describe("LandingPage", () => {
  it("renders the hero heading and the install copy button", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole("heading", { name: /your fleet/i })).toBeInTheDocument();
    expect(screen.getByTestId("landing-copy")).toHaveTextContent(/copy/i);
  });

  it("shows a sign-in link (not a profile link) for anonymous visitors", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId("landing-signin")).toHaveAttribute("to", "/signin");
    expect(screen.queryByTestId("landing-profile")).not.toBeInTheDocument();
  });

  it("shows a profile link into the unlock flow for a signed-in visitor", () => {
    renderWithProviders(<LandingPage />, { user: { id: "u1", email: "deniz@acme.io" } });
    const profile = screen.getByTestId("landing-profile");
    expect(profile).toHaveTextContent(/profile/i);
    expect(profile).toHaveAttribute("to", "/unlock");
    expect(screen.queryByTestId("landing-signin")).not.toBeInTheDocument();
  });
});
