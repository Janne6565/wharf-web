// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearVaultSession, setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getVault: vi.fn(),
  unlockWithPassword: vi.fn(),
  fromBase64: vi.fn(() => new Uint8Array(0)),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  getVault: mocks.getVault,
  // Read by the danger zone's deletion modal (both only fire once it opens).
  getCurrentUser: vi.fn(),
  getAccountDeletionPreview: vi.fn(),
  deleteAccount: vi.fn(),
  refreshSession: vi.fn(),
}));
vi.mock("@/crypto", () => ({
  fromBase64: mocks.fromBase64,
  unlockWithPassword: mocks.unlockWithPassword,
  deriveMasterKey: vi.fn(),
  deriveAuthKey: vi.fn(),
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));

import { ConnectionsPage } from "./index";

function payloadOf(hosts: unknown[]): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ schema: 1, hosts }));
}

function primeVault(hosts: unknown[]): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: payloadOf(hosts),
    params: {},
  } as unknown as UnlockedVault);
}

const TWO_HOSTS = [
  { id: "h1", name: "prod-web", user: "deploy", addr: "10.0.0.1", port: 22, tags: ["eu"] },
  { id: "h2", name: "db-main", user: "root", addr: "10.0.0.2", port: 2222, authMethod: "key" },
];

afterEach(() => {
  clearVaultSession();
  vi.clearAllMocks();
});

describe("ConnectionsPage", () => {
  it("renders every primed host with its target and a count", () => {
    primeVault(TWO_HOSTS);
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getByText("prod-web")).toBeInTheDocument();
    expect(screen.getByText("db-main")).toBeInTheDocument();
    expect(screen.getByText("deploy@10.0.0.1:22")).toBeInTheDocument();
    expect(screen.getByText("root@10.0.0.2:2222")).toBeInTheDocument();
    // The chip is a bare number; the words live in its title.
    expect(screen.getByTestId("connections-count")).toHaveTextContent("2");
    expect(screen.getByTestId("connections-count")).toHaveAttribute("title", "2 hosts");
  });

  it("filters the list down to matching hosts", async () => {
    primeVault(TWO_HOSTS);
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    await user.type(screen.getByTestId("connections-filter"), "db");

    expect(screen.getByText("db-main")).toBeInTheDocument();
    expect(screen.queryByText("prod-web")).toBeNull();
  });

  it("keeps the locked-panel unlock button disabled until a password is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getByTestId("connections-unlock")).toBeDisabled();
    await user.type(screen.getByTestId("connections-password"), "super-secret");
    expect(screen.getByTestId("connections-unlock")).toBeEnabled();
  });

  it("unlocks the vault from the locked panel and shows the hosts", async () => {
    mocks.getVault.mockResolvedValue({ vault: "AA==" });
    mocks.unlockWithPassword.mockResolvedValue({
      dek: new Uint8Array(0),
      payload: payloadOf(TWO_HOSTS),
      params: {},
    });
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getByTestId("connections-unlock")).toBeInTheDocument();
    await user.type(screen.getByTestId("connections-password"), "super-secret");
    await user.click(screen.getByTestId("connections-unlock"));

    await waitFor(() => expect(mocks.getVault).toHaveBeenCalled());
    expect(mocks.unlockWithPassword).toHaveBeenCalled();
    expect(await screen.findByText("prod-web")).toBeInTheDocument();
  });

  it("surfaces an unlock error when the password is wrong", async () => {
    mocks.getVault.mockResolvedValue({ vault: "AA==" });
    mocks.unlockWithPassword.mockRejectedValue(new Error("bad password"));
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    await user.type(screen.getByTestId("connections-password"), "wrong");
    await user.click(screen.getByTestId("connections-unlock"));

    expect(await screen.findByText(/couldn't unlock the vault/i)).toBeInTheDocument();
  });

  it("locks the vault back to the locked panel", async () => {
    primeVault(TWO_HOSTS);
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getByText("prod-web")).toBeInTheDocument();
    await user.click(screen.getByTestId("connections-lock"));

    expect(screen.queryByText("prod-web")).toBeNull();
    expect(screen.getByTestId("connections-unlock")).toBeInTheDocument();
  });

  it("renders the pair-terminal invitation exactly once alongside a host list", () => {
    primeVault(TWO_HOSTS);
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getAllByTestId("pair-terminal")).toHaveLength(1);
    expect(screen.getAllByTestId("pair-terminal-link")).toHaveLength(1);
  });

  it("promotes the same pair-terminal element — still once — when there are no hosts", () => {
    primeVault([]);
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getAllByTestId("pair-terminal")).toHaveLength(1);
    expect(screen.getAllByTestId("pair-terminal-link")).toHaveLength(1);
    expect(screen.getByText("No hosts yet")).toBeInTheDocument();
    // The filter stays in place but inert — there is nothing to filter.
    expect(screen.getByTestId("connections-filter")).toBeDisabled();
  });

  it("offers to clear a filter that matches nothing, and restores the list", async () => {
    primeVault(TWO_HOSTS);
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    await user.type(screen.getByTestId("connections-filter"), "nothing-matches");

    expect(screen.getByTestId("connections-count")).toHaveTextContent("0 / 2");
    expect(screen.getByText("no host matches “nothing-matches”")).toBeInTheDocument();
    expect(screen.getByText(/2 hosts in this vault/)).toBeInTheDocument();
    // The footer strip survives a fruitless filter.
    expect(screen.getAllByTestId("pair-terminal")).toHaveLength(1);

    await user.click(screen.getByTestId("connections-no-match-clear"));

    expect(screen.getByText("prod-web")).toBeInTheDocument();
    expect(screen.getByTestId("connections-count")).toHaveTextContent("2");
  });

  it("clears the filter from the field's own control", async () => {
    primeVault(TWO_HOSTS);
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    await user.type(screen.getByTestId("connections-filter"), "db");
    expect(screen.queryByText("prod-web")).toBeNull();

    await user.click(screen.getByTestId("connections-filter-clear"));
    expect(screen.getByText("prod-web")).toBeInTheDocument();
  });

  it("names the host count on the locked screen only after this session saw it", async () => {
    const user = userEvent.setup();
    // Cold load: nothing was ever decrypted here, so no number is claimed.
    const cold = renderWithProviders(<ConnectionsPage />);
    expect(screen.getByTestId("connections-locked-subtitle")).toHaveTextContent(
      "encrypted on this device",
    );
    cold.unmount();

    primeVault(TWO_HOSTS);
    renderWithProviders(<ConnectionsPage />);
    await user.click(screen.getByTestId("connections-lock"));

    expect(screen.getByTestId("connections-locked-subtitle")).toHaveTextContent(
      "2 hosts · encrypted on this device",
    );
  });

  it("omits the list hint when every host in the vault is on screen", () => {
    primeVault(TWO_HOSTS);
    renderWithProviders(<ConnectionsPage />);

    // Nothing filtered out and nothing scrolled away — the hint would be noise.
    expect(screen.queryByTestId("connections-list-hint")).toBeNull();
  });

  it("states how many of the vault's hosts the filter leaves on screen", async () => {
    primeVault(TWO_HOSTS);
    const user = userEvent.setup();
    renderWithProviders(<ConnectionsPage />);

    await user.type(screen.getByTestId("connections-filter"), "db");

    expect(screen.getByTestId("connections-list-hint")).toHaveTextContent("1 of 2 shown");
    // jsdom reports no overflow, so the scroll clause must not appear.
    expect(screen.getByTestId("connections-list-hint")).not.toHaveTextContent("scroll for more");
  });

  it("never renders a stored password value", () => {
    primeVault([
      {
        id: "h1",
        name: "secret-box",
        user: "root",
        addr: "1.2.3.4",
        port: 22,
        authMethod: "password",
        password: "hunter2",
      },
    ]);
    renderWithProviders(<ConnectionsPage />);

    expect(screen.getByText("secret-box")).toBeInTheDocument();
    expect(screen.queryByText("hunter2")).toBeNull();
  });
});
