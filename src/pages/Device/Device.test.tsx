// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({ search: { onboarding: false } as { onboarding: boolean } }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
  getRouteApi: () => ({ useSearch: () => mocks.search }),
}));
// Issue a device code from a stubbed backend; the page must render it as
// XXXX-XXXX and show the signed-in email.
vi.mock("@/api/wharf", () => ({
  issueDeviceCode: vi.fn().mockResolvedValue({
    code: "K7PQM2XR",
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  }),
}));

import { DevicePage } from "./index";

afterEach(() => {
  vi.clearAllMocks();
  mocks.search = { onboarding: false };
});

describe("DevicePage", () => {
  it("issues and renders a pairing code and the signed-in email", async () => {
    renderWithProviders(<DevicePage />, {
      user: { id: "u1", email: "deniz@acme.io" },
    });

    expect(screen.getByRole("heading", { name: /pair your terminal/i })).toBeInTheDocument();
    expect(screen.getByText("deniz@acme.io")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("device-code")).toHaveTextContent("K7PQ-M2XR"));
    await waitFor(() =>
      expect(screen.getByTestId("device-status")).toHaveTextContent(/expires in/i),
    );
  });

  it("shows a back link to connections and no onboarding steps when paired from the hub", () => {
    renderWithProviders(<DevicePage />, { user: { id: "u1", email: "deniz@acme.io" } });

    expect(screen.getByTestId("auth-back")).toHaveAttribute("to", "/connections");
    expect(screen.queryByText(/connect device/i)).not.toBeInTheDocument();
  });

  it("shows the onboarding step indicator and no back link during onboarding", () => {
    mocks.search = { onboarding: true };
    renderWithProviders(<DevicePage />, { user: { id: "u1", email: "deniz@acme.io" } });

    expect(screen.getByText(/connect device/i)).toBeInTheDocument();
    expect(screen.queryByTestId("auth-back")).not.toBeInTheDocument();
  });
});
