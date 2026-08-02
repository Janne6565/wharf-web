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
  loadProjectVault: vi.fn(),
  getCurrentUser: vi.fn(),
  getAccountDeletionPreview: vi.fn(),
  deleteAccount: vi.fn(),
  deriveMasterKey: vi.fn(async () => new Uint8Array(0)),
  deriveAuthKey: vi.fn(async () => "derived-auth-key"),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => ({}),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  getCurrentUser: mocks.getCurrentUser,
  getAccountDeletionPreview: mocks.getAccountDeletionPreview,
  deleteAccount: mocks.deleteAccount,
  refreshSession: vi.fn(),
}));
vi.mock("@/vault/projectVaultAccess", () => ({ loadProjectVault: mocks.loadProjectVault }));
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

function primeVault(payload = '{"schema":1,"hosts":[]}'): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: new TextEncoder().encode(payload),
    params: {},
  } as unknown as UnlockedVault);
}

const EMPTY_PREVIEW = { ownedProjects: [], otherMemberships: 0 };

// A vault holding the X25519 identity, which is what lets the client open an
// owned project's vault to count its hosts.
const VAULT_WITH_IDENTITY = JSON.stringify({
  schema: 3,
  hosts: [],
  keys: [],
  identity: { x25519Priv: "priv", x25519Pub: "pub", createdAt: "2026-07-01T00:00:00Z" },
});

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
  it("lists every owned project with how many members lose access", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });

    await openModal(user);

    expect(await screen.findByText("Atlas")).toBeInTheDocument();
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("3 members lose access")).toBeInTheDocument();
    expect(screen.getByText("only you")).toBeInTheDocument();
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

describe("DeleteAccountModal variants", () => {
  it("drops to the calm variant — and skips the email gate — with nothing to lose", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(EMPTY_PREVIEW);
    // Unlocked and provably empty: no hosts, no keys, no stored passwords.
    primeVault('{"schema":3,"hosts":[],"keys":[]}');
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(await screen.findByTestId("delete-account-calm")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-account-email")).toBeNull();
    expect(screen.getByTestId("delete-account-vault-counts")).toHaveTextContent(
      "0 hosts, 0 ssh keys, 0 stored passwords · 0 projects",
    );

    expect(screen.getByTestId("delete-account-confirm")).toBeDisabled();
    await user.type(screen.getByTestId("delete-account-password"), "correct horse");
    expect(screen.getByTestId("delete-account-confirm")).toBeEnabled();

    mocks.deleteAccount.mockResolvedValue(undefined);
    await user.click(screen.getByTestId("delete-account-confirm"));
    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalled());
  });

  it("keeps the full variant when the account still owns a project", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    primeVault('{"schema":3,"hosts":[],"keys":[]}');
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(await screen.findByTestId("delete-account-owned")).toBeInTheDocument();
    expect(screen.getByTestId("delete-account-email")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-account-calm")).toBeNull();
  });

  it("forces the full variant when the vault is locked, and warns without numbers", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(EMPTY_PREVIEW);
    // No vault session at all — the counts are unknowable, so zeros would lie.
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(await screen.findByTestId("delete-account-email")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-account-calm")).toBeNull();
    expect(screen.queryByTestId("delete-account-vault-counts")).toBeNull();
    expect(screen.getByTestId("delete-account-vault-warning")).toHaveTextContent(
      /locked on this device/i,
    );
  });

  it("counts what an unlocked vault holds in the warning", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(EMPTY_PREVIEW);
    primeVault(
      JSON.stringify({
        schema: 3,
        hosts: [
          { id: "h1", name: "a", user: "root", addr: "1.1.1.1", port: 22, password: "hunter2" },
          { id: "h2", name: "b", user: "root", addr: "1.1.1.2", port: 22 },
        ],
        keys: [{ id: "k1", name: "laptop", material: "secret-material" }],
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(await screen.findByTestId("delete-account-vault-warning")).toHaveTextContent(
      "2 hosts, 1 ssh key, 1 stored password",
    );
    // The warning counts secrets; it never renders one.
    expect(screen.queryByText(/hunter2|secret-material/)).toBeNull();
  });
});

describe("DeleteAccountModal project host counts", () => {
  it("counts each owned project's hosts by decrypting its vault client-side", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    mocks.loadProjectVault.mockImplementation(async (id: string) => ({
      awaiting: false,
      hosts: id === "p1" ? [{}, {}, {}, {}, {}, {}, {}, {}] : [{}],
    }));
    primeVault(VAULT_WITH_IDENTITY);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(await screen.findByText("8 hosts")).toBeInTheDocument();
    expect(screen.getByText("1 host")).toBeInTheDocument();
  });

  it("shows a project with no number — never a zero — when its vault cannot be read", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    mocks.loadProjectVault.mockRejectedValue(new Error("network down"));
    primeVault(VAULT_WITH_IDENTITY);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    // The project is still listed with its name and member impact...
    expect(await screen.findByText("Atlas")).toBeInTheDocument();
    expect(screen.getByText("3 members lose access")).toBeInTheDocument();
    // ...just without a host count, and with no error anywhere.
    await waitFor(() => expect(mocks.loadProjectVault).toHaveBeenCalled());
    expect(screen.queryByText(/^0 hosts$/)).toBeNull();
    expect(screen.queryByText(/couldn't/i)).toBeNull();
  });

  it("does not attempt any project decrypt while the vault is locked", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    expect(await screen.findByText("Atlas")).toBeInTheDocument();
    expect(mocks.loadProjectVault).not.toHaveBeenCalled();
  });

  it("stays submittable while the counts are still loading", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: EMAIL, hasPassword: true });
    mocks.getAccountDeletionPreview.mockResolvedValue(PREVIEW);
    // Never resolves: the confirmation must not wait on decoration.
    mocks.loadProjectVault.mockReturnValue(new Promise(() => {}));
    mocks.deleteAccount.mockResolvedValue(undefined);
    primeVault(VAULT_WITH_IDENTITY);
    const user = userEvent.setup();
    renderWithProviders(<DangerZone />, { user: USER });
    await openModal(user);

    await user.type(await screen.findByTestId("delete-account-email"), EMAIL);
    await user.type(screen.getByTestId("delete-account-password"), "correct horse");
    expect(screen.getByTestId("delete-account-confirm")).toBeEnabled();
    await user.click(screen.getByTestId("delete-account-confirm"));

    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalled());
  });
});
