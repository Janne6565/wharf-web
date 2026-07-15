// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => {
  // Minimal stand-in for @/crypto's CryptoError so the wrong-password branch is
  // testable without loading libsodium.
  class FakeCryptoError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }
  return {
    navigate: vi.fn(),
    unlockVaultWithPassword: vi.fn(),
    CryptoError: FakeCryptoError,
  };
});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/auth/vaultUnlock", () => ({
  unlockVaultWithPassword: mocks.unlockVaultWithPassword,
}));
vi.mock("@/crypto", () => ({ CryptoError: mocks.CryptoError }));

import { UnlockPage } from "./index";

const USER = { id: "u1", email: "deniz@acme.io" };

afterEach(() => vi.clearAllMocks());

describe("UnlockPage", () => {
  it("shows the signed-in email and unlock form", () => {
    renderWithProviders(<UnlockPage />, { user: USER });
    expect(screen.getByRole("heading", { name: /unlock your vault/i })).toBeInTheDocument();
    expect(screen.getByText("deniz@acme.io")).toBeInTheDocument();
  });

  it("keeps the submit button disabled until a password is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UnlockPage />, { user: USER });

    expect(screen.getByTestId("unlock-submit")).toBeDisabled();
    await user.type(screen.getByTestId("unlock-password"), "master-password");
    expect(screen.getByTestId("unlock-submit")).toBeEnabled();
  });

  it("unlocks the vault and navigates to /connections", async () => {
    mocks.unlockVaultWithPassword.mockResolvedValue(true);
    const user = userEvent.setup();
    renderWithProviders(<UnlockPage />, { user: USER });

    await user.type(screen.getByTestId("unlock-password"), "master-password");
    await user.click(screen.getByTestId("unlock-submit"));

    await waitFor(() =>
      expect(mocks.unlockVaultWithPassword).toHaveBeenCalledWith("master-password"),
    );
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/connections" }));
  });

  it("surfaces an inline error for a wrong master password", async () => {
    mocks.unlockVaultWithPassword.mockRejectedValue(new mocks.CryptoError("wrong-secret"));
    const user = userEvent.setup();
    renderWithProviders(<UnlockPage />, { user: USER });

    await user.type(screen.getByTestId("unlock-password"), "wrong-password");
    await user.click(screen.getByTestId("unlock-submit"));

    expect(
      await screen.findByText(/that master password can't decrypt your vault/i),
    ).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("routes to set-password when the account has no vault yet", async () => {
    mocks.unlockVaultWithPassword.mockResolvedValue(false);
    const user = userEvent.setup();
    renderWithProviders(<UnlockPage />, { user: USER });

    await user.type(screen.getByTestId("unlock-password"), "master-password");
    await user.click(screen.getByTestId("unlock-submit"));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/set-password" }));
  });
});
