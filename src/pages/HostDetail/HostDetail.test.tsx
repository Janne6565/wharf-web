// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearVaultSession, setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
const mocks = vi.hoisted(() => ({
  listProjects: vi.fn((): Promise<unknown[]> => Promise.resolve([])),
  ensureIdentity: vi.fn(() =>
    Promise.resolve({ kind: "ready", identity: { x25519Pub: "pub", x25519Priv: "priv" } }),
  ),
  loadProjectVault: vi.fn((): Promise<unknown> => Promise.resolve({ awaiting: true, hosts: [] })),
}));

vi.mock("@/api/wharf", () => ({
  getVault: vi.fn(),
  listProjects: mocks.listProjects,
}));
vi.mock("@/vault/identity", () => ({ ensureIdentity: mocks.ensureIdentity }));
vi.mock("@/vault/projectVaultAccess", () => ({ loadProjectVault: mocks.loadProjectVault }));
vi.mock("@/crypto", () => ({
  fromBase64: vi.fn(() => new Uint8Array(0)),
  unlockWithPassword: vi.fn(),
  deriveMasterKey: vi.fn(),
  deriveAuthKey: vi.fn(),
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));

import { HostDetailPage } from "./index";

// A stored password on the raw host: it must never reach the screen. The typed
// VaultHost drops it, and this fixture is what proves the page cannot render it.
const RAW_HOSTS = [
  {
    id: "h2",
    name: "db-main",
    user: "root",
    addr: "10.0.0.2",
    port: 2222,
    tags: ["eu", "db"],
    keyPath: "~/.ssh/id_ed25519",
    authMethod: "key",
    source: "ssh_config",
    password: "hunter2",
  },
];

function primeVault(): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: new TextEncoder().encode(JSON.stringify({ schema: 3, hosts: RAW_HOSTS })),
    params: {},
  } as unknown as UnlockedVault);
}

afterEach(() => {
  clearVaultSession();
  vi.clearAllMocks();
});

describe("HostDetailPage", () => {
  it("shows the stored connection's details", () => {
    primeVault();
    renderWithProviders(<HostDetailPage hostId="h2" />);

    expect(screen.getByTestId("host-name")).toHaveTextContent("db-main");
    expect(screen.getByText("root@10.0.0.2:2222")).toBeInTheDocument();
    expect(screen.getByText("~/.ssh/id_ed25519")).toBeInTheDocument();
    expect(screen.getByText("#eu #db")).toBeInTheDocument();
    expect(screen.getByText("imported from ~/.ssh/config")).toBeInTheDocument();
  });

  it("never renders a stored password", () => {
    primeVault();
    const { container } = renderWithProviders(<HostDetailPage hostId="h2" />);

    expect(container.textContent).not.toContain("hunter2");
  });

  it("reports a host that is not in the vault", () => {
    primeVault();
    renderWithProviders(<HostDetailPage hostId="nope" />);

    expect(screen.getByText("that connection is not in this vault.")).toBeInTheDocument();
  });

  it("asks for the master password when the vault is locked", () => {
    renderWithProviders(<HostDetailPage hostId="h2" />);

    expect(screen.getByTestId("host-password")).toBeInTheDocument();
    expect(screen.queryByTestId("host-name")).not.toBeInTheDocument();
  });

  // A shared host is not in the personal vault at all, so the page has to open
  // the project's own blob to render it.
  describe("a host shared through a project", () => {
    const PROJECT_HOST = { id: "ph1", name: "atlas-edge", user: "ops", addr: "10.9.0.1", port: 22 };

    function primeProject(): void {
      mocks.listProjects.mockResolvedValue([{ id: "p1", name: "Atlas Platform" }]);
      mocks.loadProjectVault.mockResolvedValue({ awaiting: false, hosts: [PROJECT_HOST] });
    }

    it("resolves it from the project blob and names the project", async () => {
      primeVault();
      primeProject();
      renderWithProviders(<HostDetailPage hostId="ph1" projectId="p1" />);

      expect(await screen.findByTestId("host-name")).toHaveTextContent("atlas-edge");
      expect(screen.getByText("ops@10.9.0.1:22")).toBeInTheDocument();
      expect(screen.getByTestId("host-project")).toHaveTextContent("Atlas Platform");
    });

    it("does not claim the host is missing while the blob is still decrypting", () => {
      primeVault();
      primeProject();
      renderWithProviders(<HostDetailPage hostId="ph1" projectId="p1" />);

      expect(screen.queryByText("that connection is not in this vault.")).toBeNull();
    });

    it("reports a host that is in no project the account can read", async () => {
      primeVault();
      primeProject();
      renderWithProviders(<HostDetailPage hostId="nope" projectId="p1" />);

      expect(await screen.findByText("that connection is not in this vault.")).toBeInTheDocument();
    });
  });
});
