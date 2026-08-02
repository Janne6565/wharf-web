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
  getMyInvites: vi.fn(() => Promise.resolve([])),
  unlockWithPassword: vi.fn(),
  fromBase64: vi.fn(() => new Uint8Array(0)),
  // The shared-project side of the list. Mocked at the vault-access seam so the
  // page's grouping is tested without standing up real X25519 identities.
  listProjects: vi.fn((): Promise<unknown[]> => Promise.resolve([])),
  ensureIdentity: vi.fn(() =>
    Promise.resolve({ kind: "ready", identity: { x25519Pub: "pub", x25519Priv: "priv" } }),
  ),
  loadProjectVault: vi.fn((): Promise<unknown> => Promise.resolve({ awaiting: true, hosts: [] })),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => ({}),
  // `search` is an object; serialize it so a test can assert what a row carries
  // instead of reading "[object Object]".
  Link: ({
    children,
    search,
    ...props
  }: {
    children: React.ReactNode;
    search?: Record<string, string>;
  }) => (
    <a {...props} data-search={JSON.stringify(search ?? {})}>
      {children}
    </a>
  ),
}));
vi.mock("@/api/wharf", () => ({
  getVault: mocks.getVault,
  // Read by the shell header's invite badge.
  getMyInvites: mocks.getMyInvites,
  // Read by the danger zone's deletion modal (both only fire once it opens).
  getCurrentUser: vi.fn(),
  getAccountDeletionPreview: vi.fn(),
  deleteAccount: vi.fn(),
  refreshSession: vi.fn(),
  listProjects: mocks.listProjects,
}));
vi.mock("@/vault/identity", () => ({ ensureIdentity: mocks.ensureIdentity }));
vi.mock("@/vault/projectVaultAccess", () => ({ loadProjectVault: mocks.loadProjectVault }));
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

  it("links each host row to its detail screen", () => {
    primeVault(TWO_HOSTS);
    renderWithProviders(<ConnectionsPage />);

    // The row's hover tint and trailing chevron promise a target; this is it.
    expect(screen.getByTestId("host-row-h1")).toHaveAttribute("to", "/connections/$hostId");
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

  it("promotes the same pair-terminal element — still once — when there are no hosts", async () => {
    primeVault([]);
    renderWithProviders(<ConnectionsPage />);

    // Awaited, not immediate: the shared project blobs decrypt after the
    // personal vault opens, and "No hosts yet" must not flash before they land.
    expect(await screen.findByText("No hosts yet")).toBeInTheDocument();
    expect(screen.getAllByTestId("pair-terminal")).toHaveLength(1);
    expect(screen.getAllByTestId("pair-terminal-link")).toHaveLength(1);
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
    expect(screen.getByText(/2 hosts available/)).toBeInTheDocument();
    // The footer strip survives a fruitless filter.
    expect(screen.getAllByTestId("pair-terminal")).toHaveLength(1);

    await user.click(screen.getByTestId("connections-no-match-clear"));

    expect(screen.getByText("prod-web")).toBeInTheDocument();
    expect(screen.getByTestId("connections-count")).toHaveTextContent("2");
  });

  // Project hosts live in their own per-project blobs, not the personal vault.
  // The hub decrypts them too, so the list is the whole fleet.
  describe("shared project hosts", () => {
    const PROJECT_HOST = {
      id: "ph1",
      name: "atlas-edge",
      user: "ops",
      addr: "10.9.0.1",
      port: 22,
      tags: ["shared"],
    };

    function primeProject(hosts: unknown[]): void {
      mocks.listProjects.mockResolvedValue([{ id: "p1", name: "Atlas Platform", role: "MEMBER" }]);
      mocks.loadProjectVault.mockResolvedValue({ awaiting: false, hosts });
    }

    it("lists hosts stored in a project alongside the personal ones", async () => {
      primeVault(TWO_HOSTS);
      primeProject([PROJECT_HOST]);
      renderWithProviders(<ConnectionsPage />);

      expect(await screen.findByText("atlas-edge")).toBeInTheDocument();
      expect(screen.getByText("ops@10.9.0.1:22")).toBeInTheDocument();
      // Personal hosts stay where they were.
      expect(screen.getByText("prod-web")).toBeInTheDocument();
      // The count is the fleet, not the personal vault.
      expect(screen.getByTestId("connections-count")).toHaveTextContent("3");
    });

    it("labels each run of hosts with where it comes from", async () => {
      primeVault(TWO_HOSTS);
      primeProject([PROJECT_HOST]);
      renderWithProviders(<ConnectionsPage />);

      expect(await screen.findByText("Atlas Platform")).toBeInTheDocument();
      expect(screen.getByText("personal")).toBeInTheDocument();
    });

    it("carries the project on the row's link so the detail screen can find it", async () => {
      primeVault(TWO_HOSTS);
      primeProject([PROJECT_HOST]);
      renderWithProviders(<ConnectionsPage />);

      const row = await screen.findByTestId("host-row-ph1");
      expect(row).toHaveAttribute("to", "/connections/$hostId");
      expect(row).toHaveAttribute("data-search", '{"project":"p1"}');
      // A personal row must not claim a project.
      expect(screen.getByTestId("host-row-h1")).toHaveAttribute("data-search", "{}");
    });

    it("shows project hosts even when the personal vault is empty", async () => {
      primeVault([]);
      primeProject([PROJECT_HOST]);
      renderWithProviders(<ConnectionsPage />);

      expect(await screen.findByText("atlas-edge")).toBeInTheDocument();
      // The "no hosts yet" invitation would be false here.
      expect(screen.queryByText("No hosts yet")).toBeNull();
    });

    it("filters across both origins at once", async () => {
      primeVault(TWO_HOSTS);
      primeProject([PROJECT_HOST]);
      const user = userEvent.setup();
      renderWithProviders(<ConnectionsPage />);

      await screen.findByText("atlas-edge");
      await user.type(screen.getByTestId("connections-filter"), "atlas");

      expect(screen.getByText("atlas-edge")).toBeInTheDocument();
      expect(screen.queryByText("prod-web")).toBeNull();
      // A section that filters to nothing takes its heading with it.
      expect(screen.queryByText("personal")).toBeNull();
      expect(screen.getByTestId("connections-count")).toHaveTextContent("1 / 3");
    });

    it("says so when a project's hosts cannot be decrypted rather than hiding them", async () => {
      primeVault(TWO_HOSTS);
      mocks.listProjects.mockResolvedValue([
        { id: "p1", name: "Atlas Platform", awaitingKey: true },
      ]);
      renderWithProviders(<ConnectionsPage />);

      expect(await screen.findByTestId("connections-unreadable-projects")).toHaveTextContent(
        /1 project's hosts can't be shown yet/,
      );
    });
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
