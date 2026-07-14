// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

// Issue a device code from a stubbed backend; the page must render it as
// XXXX-XXXX and show the signed-in email.
vi.mock("@/api/wharf", () => ({
  issueDeviceCode: vi.fn().mockResolvedValue({
    code: "K7PQM2XR",
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  }),
}));

import { DevicePage } from "./index";

afterEach(() => vi.clearAllMocks());

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
});
