// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/auth/tokenStore";
import { clearVaultSession, getVaultSession, setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  logout: mocks.logout,
  // Read by the shell header's invite badge.
  getMyInvites: vi.fn(() => Promise.resolve([])),
  getCurrentUser: mocks.getCurrentUser,
  getAccountDeletionPreview: vi.fn(),
  deleteAccount: vi.fn(),
  refreshSession: vi.fn(),
}));
vi.mock("@/crypto", () => ({
  deriveMasterKey: vi.fn(),
  deriveAuthKey: vi.fn(),
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));

import { AccountPage } from "./index";

const EMAIL = "mara@acme.io";
const USER = { id: "u1", email: EMAIL };

function primeVault(): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: new TextEncoder().encode('{"schema":1,"hosts":[]}'),
    params: {},
  } as unknown as UnlockedVault);
}

afterEach(() => {
  clearVaultSession();
  clearAccessToken();
  vi.clearAllMocks();
});

describe("AccountPage", () => {
  it("shows the signed-in address with the verified state from the profile", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, emailVerified: true });
    renderWithProviders(<AccountPage />, { user: USER });

    expect(screen.getByTestId("account-email")).toHaveTextContent(EMAIL);
    expect(await screen.findByTestId("account-email-verified")).toHaveTextContent("verified");
  });

  it("says so when the profile reports the address is not verified", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, emailVerified: false });
    renderWithProviders(<AccountPage />, { user: USER });

    expect(await screen.findByTestId("account-email-verified")).toHaveTextContent("not verified");
  });

  it("claims nothing about verification until the profile resolves", () => {
    mocks.getCurrentUser.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AccountPage />, { user: USER });

    expect(screen.queryByTestId("account-email-verified")).toBeNull();
  });

  it("signs out: clears the session and the vault, then leaves for the landing page", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, emailVerified: true });
    mocks.logout.mockResolvedValue(undefined);
    setAccessToken("live-token");
    primeVault();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />, { user: USER });

    await user.click(screen.getByTestId("account-sign-out"));

    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
    await waitFor(() => expect(getAccessToken()).toBeNull());
    expect(getVaultSession()).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("still signs out locally when the logout request fails", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, emailVerified: true });
    mocks.logout.mockRejectedValue(new Error("offline"));
    setAccessToken("live-token");
    primeVault();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />, { user: USER });

    await user.click(screen.getByTestId("account-sign-out"));

    await waitFor(() => expect(getAccessToken()).toBeNull());
    expect(getVaultSession()).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/" });
  });
});
