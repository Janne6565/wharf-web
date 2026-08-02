// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

// The landing nav uses TanStack's <Link>, which needs a router context; stub it
// with a plain anchor so the page renders in isolation (mirrors Signin.test).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

import { LandingPage } from "./index";

const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126";
const WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126";

// jsdom's navigator.userAgent is read-only, so the install box's platform
// detection can only be exercised by redefining it per test.
function setUserAgent(value: string) {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    value,
    configurable: true,
  });
}

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

  it("links to the legal notice from the footer", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId("landing-impressum")).toHaveAttribute("to", "/impressum");
  });

  it("links to the privacy notice from the footer", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId("landing-datenschutz")).toHaveAttribute("to", "/datenschutz");
  });

  it("shows a profile link into the unlock flow for a signed-in visitor", () => {
    renderWithProviders(<LandingPage />, { user: { id: "u1", email: "deniz@acme.io" } });
    const profile = screen.getByTestId("landing-profile");
    expect(profile).toHaveTextContent(/profile/i);
    expect(profile).toHaveAttribute("to", "/unlock");
    expect(screen.queryByTestId("landing-signin")).not.toBeInTheDocument();
  });

  it("offers only the macOS channels once the platform is detected", async () => {
    setUserAgent(MAC_UA);
    renderWithProviders(<LandingPage />);
    await waitFor(() => expect(screen.getByTestId("install-tab-brew")).toBeInTheDocument());
    expect(screen.queryByTestId("install-tab-choco")).not.toBeInTheDocument();
    expect(screen.queryByTestId("install-tab-winget")).not.toBeInTheDocument();
    expect(screen.queryByTestId("install-tab-apt")).not.toBeInTheDocument();
  });

  it("offers only the Windows channels on Windows", async () => {
    setUserAgent(WINDOWS_UA);
    renderWithProviders(<LandingPage />);
    await waitFor(() => expect(screen.getByTestId("install-tab-winget")).toBeInTheDocument());
    expect(screen.queryByTestId("install-tab-brew")).not.toBeInTheDocument();
    // The installer is a POSIX shell script.
    expect(screen.queryByTestId("install-tab-script")).not.toBeInTheDocument();
  });

  it("shows the platform's default command and switches on tab click", async () => {
    setUserAgent(MAC_UA);
    renderWithProviders(<LandingPage />);
    await waitFor(() => expect(screen.getByTestId("install-tab-brew")).toBeInTheDocument());
    expect(screen.getByText("brew install Janne6565/tap/wharf")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("install-tab-npm"));
    expect(screen.getByText("npm i -g wharf-tui")).toBeInTheDocument();
    expect(screen.queryByText("brew install Janne6565/tap/wharf")).not.toBeInTheDocument();
  });
});
