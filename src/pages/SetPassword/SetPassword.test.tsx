// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getCurrentUser: vi.fn(),
  setupAccount: vi.fn(),
  buildOnboardingVault: vi.fn(),
  setPendingRecoveryCode: vi.fn(),
  setVaultSession: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/api/wharf", () => ({
  getCurrentUser: mocks.getCurrentUser,
  setupAccount: mocks.setupAccount,
}));
// Mock the onboarding crypto at the module boundary (like Signin.test does for
// @/crypto): the real derivations are covered by the crypto unit tests.
vi.mock("@/auth/vaultOnboarding", () => ({
  buildOnboardingVault: mocks.buildOnboardingVault,
}));
vi.mock("@/auth/recoveryHandoff", () => ({
  setPendingRecoveryCode: mocks.setPendingRecoveryCode,
}));
vi.mock("@/auth/vaultSession", () => ({ setVaultSession: mocks.setVaultSession }));
vi.mock("@/crypto", () => ({ toBase64: vi.fn(() => "b64-vault") }));

import { SetPasswordPage } from "./index";

const PASSWORD = "correct-horse-battery";
const VAULT = { dek: new Uint8Array(0), payload: new Uint8Array(0) };

function seedHappyPath() {
  mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "dev@acme.io", hasVault: false });
  mocks.buildOnboardingVault.mockResolvedValue({
    authKey: "derived-auth-key",
    recoveryAuthKey: "derived-recovery-auth-key",
    blob: new Uint8Array([1, 2, 3]),
    recoveryCode: "RECOVERY-CODE",
    vault: VAULT,
  });
  mocks.setupAccount.mockResolvedValue(undefined);
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId("setpassword-password"), PASSWORD);
  await user.type(screen.getByTestId("setpassword-confirm"), PASSWORD);
  await user.click(screen.getByTestId("setpassword-understand"));
  // Enabled only once the profile has loaded (ready) and the form is complete.
  await waitFor(() => expect(screen.getByTestId("setpassword-submit")).toBeEnabled());
  await user.click(screen.getByTestId("setpassword-submit"));
}

afterEach(() => vi.clearAllMocks());

describe("SetPasswordPage", () => {
  it("submits recoveryAuthKey + vault + authKey to /auth/setup and hands off the recovery code", async () => {
    seedHappyPath();
    const user = userEvent.setup();
    renderWithProviders(<SetPasswordPage />);

    await fillAndSubmit(user);

    await waitFor(() =>
      expect(mocks.setupAccount).toHaveBeenCalledWith({
        recoveryAuthKey: "derived-recovery-auth-key",
        vault: "b64-vault",
        authKey: "derived-auth-key",
      }),
    );
    // The vault must be built from the OAuth account's email + chosen password,
    // through the exact same helper the classic sign-up uses.
    expect(mocks.buildOnboardingVault).toHaveBeenCalledWith("dev@acme.io", PASSWORD);
    expect(mocks.setVaultSession).toHaveBeenCalledWith(VAULT);
    expect(mocks.setPendingRecoveryCode).toHaveBeenCalledWith("RECOVERY-CODE");
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/welcome/recovery-code" }),
    );
  });

  it("stays on the recovery-code screen after setup flips hasVault in the profile cache", async () => {
    // Regression: onSuccess writes hasVault:true into the ME cache, which re-runs
    // the "already has a vault" effect. If that effect still navigates, it lands
    // after the recovery-code navigation and the one-time code is never shown.
    seedHappyPath();
    const user = userEvent.setup();
    renderWithProviders(<SetPasswordPage />);

    await fillAndSubmit(user);

    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/welcome/recovery-code" }),
    );
    expect(mocks.navigate).not.toHaveBeenCalledWith({ to: "/unlock" });
  });

  it("routes forward instead of erroring when setup reports 409 (already set up)", async () => {
    seedHappyPath();
    mocks.setupAccount.mockRejectedValue({ isAxiosError: true, response: { status: 409 } });
    const user = userEvent.setup();
    renderWithProviders(<SetPasswordPage />);

    // Fill the form; the button enabling confirms the profile has loaded. Then
    // make the 409 re-check of /users/me report the vault as existing.
    await user.type(screen.getByTestId("setpassword-password"), PASSWORD);
    await user.type(screen.getByTestId("setpassword-confirm"), PASSWORD);
    await user.click(screen.getByTestId("setpassword-understand"));
    await waitFor(() => expect(screen.getByTestId("setpassword-submit")).toBeEnabled());
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "dev@acme.io", hasVault: true });
    await user.click(screen.getByTestId("setpassword-submit"));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/unlock" }));
    expect(mocks.setPendingRecoveryCode).not.toHaveBeenCalled();
  });

  it("enables the submit button only once password, confirm, and acknowledgement are set", async () => {
    seedHappyPath();
    const user = userEvent.setup();
    renderWithProviders(<SetPasswordPage />);

    // Disabled until the profile loads and every required field is filled.
    expect(screen.getByTestId("setpassword-submit")).toBeDisabled();
    await user.type(screen.getByTestId("setpassword-password"), PASSWORD);
    await user.type(screen.getByTestId("setpassword-confirm"), PASSWORD);
    expect(screen.getByTestId("setpassword-submit")).toBeDisabled();
    await user.click(screen.getByTestId("setpassword-understand"));
    await waitFor(() => expect(screen.getByTestId("setpassword-submit")).toBeEnabled());
  });

  it("redirects to unlock when the profile already has a vault", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "dev@acme.io", hasVault: true });
    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/unlock" }));
  });
});
