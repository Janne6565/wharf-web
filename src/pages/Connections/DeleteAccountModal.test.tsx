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
  getCurrentUser: vi.fn(),
  getAccountDeletionPreview: vi.fn(),
  deleteAccount: vi.fn(),
  deriveMasterKey: vi.fn(async () => new Uint8Array(0)),
  deriveAuthKey: vi.fn(async () => "derived-auth-key"),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  getCurrentUser: mocks.getCurrentUser,
  getAccountDeletionPreview: mocks.getAccountDeletionPreview,
  deleteAccount: mocks.deleteAccount,
  refreshSession: vi.fn(),
}));
vi.mock("@/crypto", () => ({
  deriveMasterKey: mocks.deriveMasterKey,
  deriveAuthKey: mocks.deriveAuthKey,
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));

import { DangerZone } from "./DangerZone";

const EMAIL = "mara@acme.io";
const USER = { id: "u1", email: EMAIL };

const PREVIEW = {
  ownedProjects: [
    { id: "p1", name: "Atlas", otherMemberCount: 3 },
    { id: "p2", name: "Solo", otherMemberCount: 0 },
  ],
  otherMemberships: 1,
};

function axiosError(status: number, code?: string): Error {
  return Object.assign(new Error("request failed"), {
    isAxiosError: true,
    response: { status, data: code ? { code } : {} },
  });
}

function primeVault(): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: new TextEncoder().encode('{"schema":1,"hosts":[]}'),
    params: {},
  } as unknown as UnlockedVault);
}

// Opens the confirmation and waits for the preview to land.
async function openModal(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByTestId("delete-account-open"));
  await screen.findByTestId("delete-account-modal");
}

afterEach(() => {
  clearVaultSession();
  clearAccessToken();
  vi.clearAllMocks();
});

describe("DangerZone account deletion", () => {
  it("lists every owned project with how many others lose access", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });

    await openModal(user);

    expect(await screen.findByText("Atlas")).toBeInTheDocument();
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("3 other members lose access")).toBeInTheDocument();
    expect(screen.getByText("no other members")).toBeInTheDocument();
    expect(screen.getByText("3 other people lose access.")).toBeInTheDocument();
    expect(
      screen.getByText("you are also removed from 1 project you don't own."),
    ).toBeInTheDocument();
  });

  it("says so plainly when the account owns nothing", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue({ ownedProjects: [], otherMemberships: 0 });
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });

    await openModal(user);

    expect(await screen.findByTestId("delete-account-no-projects")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-account-owned")).toBeNull();
  });

  it("keeps confirm disabled until the email is typed exactly", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(screen.getByTestId("delete-account-confirm")).toBeDisabled();
    await user.type(screen.getByTestId("delete-account-email"), "mara@acme.i");
    await user.type(screen.getByTestId("delete-account-password"), "correct horse");
    expect(screen.getByTestId("delete-account-confirm")).toBeDisabled();

    await user.type(screen.getByTestId("delete-account-email"), "o");
    expect(screen.getByTestId("delete-account-confirm")).toBeEnabled();
  });

  it("surfaces the 401 message and keeps the session on a wrong master password", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    mocks.deleteAccount.mockRejectedValue(axiosError(401));
    setAccessToken("live-token");
    primeVault();
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    await user.type(screen.getByTestId("delete-account-email"), EMAIL);
    await user.type(screen.getByTestId("delete-account-password"), "wrong");
    await user.click(screen.getByTestId("delete-account-confirm"));

    expect(await screen.findByText("that master password is not correct")).toBeInTheDocument();
    expect(getAccessToken()).toBe("live-token");
    expect(getVaultSession()).not.toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("prompts for the password when the server reports auth_key_required", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    mocks.deleteAccount.mockRejectedValue(axiosError(400, "auth_key_required"));
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    await user.type(screen.getByTestId("delete-account-email"), EMAIL);
    await user.type(screen.getByTestId("delete-account-password"), "whatever");
    await user.click(screen.getByTestId("delete-account-confirm"));

    expect(await screen.findByText("enter your master password to confirm")).toBeInTheDocument();
  });

  it("clears the session and the vault and leaves for the landing page on success", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    mocks.deleteAccount.mockResolvedValue(undefined);
    setAccessToken("live-token");
    primeVault();
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    await user.type(screen.getByTestId("delete-account-email"), EMAIL);
    await user.type(screen.getByTestId("delete-account-password"), "correct horse");
    await user.click(screen.getByTestId("delete-account-confirm"));

    await waitFor(() =>
      expect(mocks.deleteAccount).toHaveBeenCalledWith({
        authKey: "derived-auth-key",
      }),
    );
    await waitFor(() => expect(getAccessToken()).toBeNull());
    expect(getVaultSession()).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("skips the password step for an OAuth-only account and omits the authKey", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: false });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    mocks.deleteAccount.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    await waitFor(() => expect(screen.queryByTestId("delete-account-password")).toBeNull());
    await user.type(screen.getByTestId("delete-account-email"), EMAIL);
    await user.click(screen.getByTestId("delete-account-confirm"));

    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledWith({ authKey: undefined }));
    expect(mocks.deriveAuthKey).not.toHaveBeenCalled();
  });
});
