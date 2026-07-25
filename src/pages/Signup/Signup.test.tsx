// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  registerAccount: vi.fn(),
  listOAuthProviders: vi.fn().mockResolvedValue({ providers: [] }),
  establishSession: vi.fn(),
  setVaultSession: vi.fn(),
  setPendingRecoveryCode: vi.fn(),
  setPendingVerificationEmail: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  registerAccount: mocks.registerAccount,
  listOAuthProviders: mocks.listOAuthProviders,
}));
vi.mock("@/auth/session", () => ({ establishSession: mocks.establishSession }));
vi.mock("@/auth/vaultSession", () => ({ setVaultSession: mocks.setVaultSession }));
vi.mock("@/auth/recoveryHandoff", () => ({
  setPendingRecoveryCode: mocks.setPendingRecoveryCode,
}));
vi.mock("@/auth/verificationHandoff", () => ({
  setPendingVerificationEmail: mocks.setPendingVerificationEmail,
}));
// Stub the heavy key derivation so the UI-wiring test stays fast; the real
// crypto is covered by the crypto unit tests + the backend E2E script.
vi.mock("@/auth/vaultOnboarding", () => ({
  buildOnboardingVault: vi.fn().mockResolvedValue({
    authKey: "auth-key",
    recoveryAuthKey: "recovery-auth-key",
    blob: new Uint8Array(0),
    recoveryCode: "RECOVERY-CODE",
    vault: { hosts: [] },
  }),
}));
vi.mock("@/crypto", () => ({
  normalizeEmail: (e: string) => e.trim().toLowerCase(),
  toBase64: () => "AA==",
}));

import { SignupPage } from "./index";

afterEach(() => vi.clearAllMocks());

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByTestId("signup-email"), "deniz@acme.io");
  await user.type(screen.getByTestId("signup-password"), "super-secret-pass");
  await user.type(screen.getByTestId("signup-confirm"), "super-secret-pass");
  await user.click(screen.getByTestId("signup-understand"));
  await user.click(screen.getByTestId("signup-submit"));
}

describe("SignupPage", () => {
  it("registers, primes the vault and routes to the recovery-code screen", async () => {
    mocks.registerAccount.mockResolvedValue({ email: "deniz@acme.io", verificationRequired: true });
    renderWithProviders(<SignupPage />);

    await fillAndSubmit();

    await waitFor(() =>
      expect(mocks.registerAccount).toHaveBeenCalledWith({
        email: "deniz@acme.io",
        authKey: "auth-key",
        recoveryAuthKey: "recovery-auth-key",
        vault: "AA==",
      }),
    );
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/welcome/recovery-code" }),
    );
    expect(mocks.setVaultSession).toHaveBeenCalled();
    expect(mocks.setPendingRecoveryCode).toHaveBeenCalledWith("RECOVERY-CODE");
    expect(mocks.setPendingVerificationEmail).toHaveBeenCalledWith("deniz@acme.io");
  });

  it("does not establish a session — registration issues no tokens", async () => {
    mocks.registerAccount.mockResolvedValue({ email: "deniz@acme.io", verificationRequired: true });
    renderWithProviders(<SignupPage />);

    await fillAndSubmit();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.establishSession).not.toHaveBeenCalled();
  });

  it("surfaces an email-taken error on 409", async () => {
    mocks.registerAccount.mockRejectedValue({ isAxiosError: true, response: { status: 409 } });
    renderWithProviders(<SignupPage />);

    await fillAndSubmit();

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
