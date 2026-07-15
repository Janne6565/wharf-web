// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  login: vi.fn(),
  getVault: vi.fn(),
  listOAuthProviders: vi.fn().mockResolvedValue({ providers: [] }),
  establishSession: vi.fn(),
  setVaultSession: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  login: mocks.login,
  getVault: mocks.getVault,
  listOAuthProviders: mocks.listOAuthProviders,
}));
vi.mock("@/auth/session", () => ({ establishSession: mocks.establishSession }));
vi.mock("@/auth/vaultSession", () => ({ setVaultSession: mocks.setVaultSession }));
// Stub the heavy crypto so the UI-wiring test stays fast and deterministic; the
// real crypto is covered by the crypto unit tests + the backend E2E script.
vi.mock("@/crypto", () => ({
  deriveMasterKey: vi.fn().mockResolvedValue(new Uint8Array(32)),
  deriveAuthKey: vi.fn().mockResolvedValue("derived-auth-key"),
  fromBase64: vi.fn(() => new Uint8Array(0)),
  normalizeEmail: (e: string) => e.trim().toLowerCase(),
  unlockWithPassword: vi
    .fn()
    .mockResolvedValue({ dek: new Uint8Array(0), payload: new Uint8Array(0) }),
}));

import { SigninPage } from "./index";

afterEach(() => vi.clearAllMocks());

describe("SigninPage", () => {
  it("renders the welcome-back copy and fields", () => {
    renderWithProviders(<SigninPage />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock vault/i })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);
    await user.click(screen.getByTestId("signin-submit"));
    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("derives the auth key, logs in, and navigates to /device on success", async () => {
    mocks.login.mockResolvedValue({
      accessToken: "access",
      user: { id: "u1", email: "deniz@acme.io" },
    });
    mocks.getVault.mockResolvedValue({ vault: "AA==" });
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);

    await user.type(screen.getByTestId("signin-email"), "deniz@acme.io");
    await user.type(screen.getByTestId("signin-password"), "super-secret-pass");
    await user.click(screen.getByTestId("signin-submit"));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith({
        email: "deniz@acme.io",
        authKey: "derived-auth-key",
        tokenMode: "COOKIE",
      }),
    );
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/device" }));
    expect(mocks.establishSession).toHaveBeenCalledWith("access", {
      id: "u1",
      email: "deniz@acme.io",
    });
  });

  it("surfaces an invalid-credentials error on 401", async () => {
    mocks.login.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);

    await user.type(screen.getByTestId("signin-email"), "deniz@acme.io");
    await user.type(screen.getByTestId("signin-password"), "wrong-password");
    await user.click(screen.getByTestId("signin-submit"));

    expect(await screen.findByText(/email or master password is incorrect/i)).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
