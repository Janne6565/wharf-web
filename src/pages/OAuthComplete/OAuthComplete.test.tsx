// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getCurrentUser: vi.fn(),
  ensureSessionBootstrapped: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => ({}),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/auth/session", () => ({
  ensureSessionBootstrapped: mocks.ensureSessionBootstrapped,
}));
vi.mock("@/auth/tokenStore", () => ({ getAccessToken: mocks.getAccessToken }));

import { OAuthCompletePage } from "./index";

afterEach(() => vi.clearAllMocks());

describe("OAuthCompletePage", () => {
  it("renders a human message and back links for a known error code", () => {
    renderWithProviders(<OAuthCompletePage error="email_not_verified" />);

    expect(screen.getByTestId("oauth-error")).toBeInTheDocument();
    expect(screen.getByText(/email isn't verified/i)).toBeInTheDocument();
    expect(screen.getByText(/back to sign in/i)).toHaveAttribute("to", "/signin");
    expect(screen.getByText(/create an account/i)).toHaveAttribute("to", "/signup");
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it("offers a way to verify for an unverified wharf account", () => {
    renderWithProviders(<OAuthCompletePage error="account_not_verified" />);

    expect(screen.getByText(/your account is not verified yet/i)).toBeInTheDocument();
    expect(screen.getByTestId("oauth-verify-email")).toHaveAttribute("to", "/signin");
  });

  it("explains an unverified local account blocking the provider link", () => {
    renderWithProviders(<OAuthCompletePage error="unverified_account_conflict" />);

    expect(screen.getByText(/already exists but was never verified/i)).toBeInTheDocument();
    expect(screen.getByTestId("oauth-verify-email")).toBeInTheDocument();
  });

  it("falls back to a generic message for an unknown error code", () => {
    renderWithProviders(<OAuthCompletePage error="something_new" />);
    expect(screen.getByText(/couldn't complete sign-in/i)).toBeInTheDocument();
  });

  it("routes a first-time OAuth account (no vault) to set-password", async () => {
    mocks.ensureSessionBootstrapped.mockResolvedValue(undefined);
    mocks.getAccessToken.mockReturnValue("access-token");
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.io", hasVault: false });

    renderWithProviders(<OAuthCompletePage />);
    expect(screen.getByTestId("oauth-loading")).toBeInTheDocument();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/set-password" }));
  });

  it("routes an existing account (vault present) to unlock", async () => {
    mocks.ensureSessionBootstrapped.mockResolvedValue(undefined);
    mocks.getAccessToken.mockReturnValue("access-token");
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.io", hasVault: true });

    renderWithProviders(<OAuthCompletePage />);

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/unlock" }));
  });

  it("shows the server error card when no session could be established", async () => {
    mocks.ensureSessionBootstrapped.mockResolvedValue(undefined);
    mocks.getAccessToken.mockReturnValue(null);

    renderWithProviders(<OAuthCompletePage />);

    expect(await screen.findByTestId("oauth-error")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong completing sign-in/i)).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
