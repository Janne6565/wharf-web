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
});
