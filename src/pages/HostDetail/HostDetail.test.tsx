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
vi.mock("@/api/wharf", () => ({
  getVault: vi.fn(),
}));
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
});
