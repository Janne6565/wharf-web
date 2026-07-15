// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  listOAuthProviders: vi.fn(),
  beginOAuth: vi.fn(),
}));

vi.mock("@/api/wharf", () => ({ listOAuthProviders: mocks.listOAuthProviders }));
vi.mock("@/auth/oauth", () => ({ beginOAuth: mocks.beginOAuth }));

import { OAuthButtons } from "./index";

afterEach(() => vi.clearAllMocks());

describe("OAuthButtons", () => {
  it("enables exactly the providers the backend reports", async () => {
    mocks.listOAuthProviders.mockResolvedValue({ providers: ["github"] });
    renderWithProviders(<OAuthButtons />);

    await waitFor(() => expect(screen.getByTestId("oauth-github")).toBeEnabled());
    expect(screen.getByTestId("oauth-google")).toBeDisabled();
    expect(screen.getByTestId("oauth-google")).toHaveAccessibleName(/coming soon/i);
  });

  it("keeps both providers disabled when none are configured", async () => {
    mocks.listOAuthProviders.mockResolvedValue({ providers: [] });
    renderWithProviders(<OAuthButtons />);

    await waitFor(() => expect(mocks.listOAuthProviders).toHaveBeenCalled());
    expect(screen.getByTestId("oauth-google")).toBeDisabled();
    expect(screen.getByTestId("oauth-github")).toBeDisabled();
  });

  it("keeps both providers disabled when the providers request fails", async () => {
    mocks.listOAuthProviders.mockRejectedValue(new Error("network"));
    renderWithProviders(<OAuthButtons />);

    await waitFor(() => expect(mocks.listOAuthProviders).toHaveBeenCalled());
    expect(screen.getByTestId("oauth-google")).toBeDisabled();
    expect(screen.getByTestId("oauth-github")).toBeDisabled();
  });

  it("starts the full-page OAuth redirect when an enabled provider is clicked", async () => {
    mocks.listOAuthProviders.mockResolvedValue({ providers: ["google", "github"] });
    const user = userEvent.setup();
    renderWithProviders(<OAuthButtons />);

    await waitFor(() => expect(screen.getByTestId("oauth-google")).toBeEnabled());
    await user.click(screen.getByTestId("oauth-google"));
    expect(mocks.beginOAuth).toHaveBeenCalledWith("google");
  });
});
