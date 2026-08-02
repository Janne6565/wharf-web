// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  search: {} as { redirect?: string },
  navigate: vi.fn(),
  login: vi.fn(),
  getVault: vi.fn(),
  listOAuthProviders: vi.fn().mockResolvedValue({ providers: [] }),
  establishSession: vi.fn(),
  setVaultSession: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => mocks.search,
  // `search` is an object, so serialise it onto a data attribute the assertions
  // can read (a raw object prop would render as "[object Object]").
  Link: ({
    children,
    search,
    ...props
  }: {
    children: React.ReactNode;
    search?: Record<string, string>;
  }) => (
    <a data-search={search ? JSON.stringify(search) : undefined} {...props}>
      {children}
    </a>
  ),
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

afterEach(() => {
  vi.clearAllMocks();
  mocks.search = {};
});

describe("SigninPage", () => {
  it("renders the welcome-back copy and fields", () => {
    renderWithProviders(<SigninPage />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock vault/i })).toBeInTheDocument();
  });

  it("renders a back link to the landing page", () => {
    renderWithProviders(<SigninPage />);
    expect(screen.getByTestId("back-link")).toHaveAttribute("to", "/");
  });

  it("keeps the submit button disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);

    expect(screen.getByTestId("signin-submit")).toBeDisabled();
    await user.type(screen.getByTestId("signin-email"), "deniz@acme.io");
    expect(screen.getByTestId("signin-submit")).toBeDisabled();
    await user.type(screen.getByTestId("signin-password"), "super-secret-pass");
    expect(screen.getByTestId("signin-submit")).toBeEnabled();
  });

  it("surfaces zod validation errors on a filled-but-invalid submit and does not call the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);
    // Non-empty (so the button is enabled) but not a valid email — the format
    // rule must still surface as a submit-time validation error.
    await user.type(screen.getByTestId("signin-email"), "not-an-email");
    await user.type(screen.getByTestId("signin-password"), "super-secret-pass");
    await user.click(screen.getByTestId("signin-submit"));
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("derives the auth key, logs in, and navigates to /connections on success", async () => {
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
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/connections" }));
    expect(mocks.establishSession).toHaveBeenCalledWith("access", {
      id: "u1",
      email: "deniz@acme.io",
    });
  });

  it("returns to where a guard bounced the visitor from", async () => {
    // The TUI opens /device; an anonymous visitor is sent to /signin carrying
    // that destination, and signing in must put them back on it — otherwise
    // the terminal waits for a code they never see.
    mocks.search = { redirect: "/device?onboarding=false" };
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);

    await user.type(screen.getByTestId("signin-email"), "deniz@acme.io");
    await user.type(screen.getByTestId("signin-password"), "super-secret-pass");
    await user.click(screen.getByTestId("signin-submit"));

    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/device?onboarding=false" }),
    );
  });

  it("tells an unverified account to verify and links on with the typed email", async () => {
    mocks.login.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { code: "email_not_verified" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SigninPage />);

    await user.type(screen.getByTestId("signin-email"), "Deniz@Acme.io");
    await user.type(screen.getByTestId("signin-password"), "super-secret-pass");
    await user.click(screen.getByTestId("signin-submit"));

    expect(await screen.findByText(/your account is not verified yet/i)).toBeInTheDocument();
    const link = screen.getByTestId("signin-verify-email");
    expect(link).toHaveAttribute("to", "/welcome/verify-email");
    // The address is normalized before it is handed on, exactly as login sends it.
    expect(link).toHaveAttribute("data-search", JSON.stringify({ email: "deniz@acme.io" }));
    expect(mocks.navigate).not.toHaveBeenCalled();
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
