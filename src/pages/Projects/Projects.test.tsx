// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearVaultSession, setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  listProjects: vi.fn(),
  getMyInvites: vi.fn(),
  acceptInvite: vi.fn(),
  declineInvite: vi.fn(),
  createProject: vi.fn(),
  getVault: vi.fn(),
  ensureIdentity: vi.fn(),
  runFinalizePass: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  listProjects: mocks.listProjects,
  getMyInvites: mocks.getMyInvites,
  acceptInvite: mocks.acceptInvite,
  declineInvite: mocks.declineInvite,
  createProject: mocks.createProject,
  getVault: mocks.getVault,
}));
vi.mock("@/vault/identity", () => ({ ensureIdentity: mocks.ensureIdentity }));
vi.mock("@/vault/finalize", () => ({ runFinalizePass: mocks.runFinalizePass }));

import { ProjectsPage } from "./index";

const IDENTITY = { x25519Priv: "cHJpdg==", x25519Pub: "cHVi", createdAt: "t" };

function primeVault(): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: new TextEncoder().encode('{"schema":2,"hosts":[]}'),
    params: {},
  } as unknown as UnlockedVault);
}

afterEach(() => {
  clearVaultSession();
  vi.clearAllMocks();
});

describe("ProjectsPage", () => {
  it("lists projects with role, member count and an awaiting-access marker", async () => {
    primeVault();
    mocks.ensureIdentity.mockResolvedValue({ kind: "ready", identity: IDENTITY });
    mocks.getMyInvites.mockResolvedValue([]);
    mocks.listProjects.mockResolvedValue([
      { id: "p1", name: "Atlas", description: "core", role: "OWNER", memberCount: 3 },
      { id: "p2", name: "Beta", role: "MEMBER", memberCount: 1, awaitingKey: true },
    ]);

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText("Atlas")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("awaiting access")).toBeInTheDocument();
  });

  it("shows incoming invites and accepts one inline", async () => {
    primeVault();
    mocks.ensureIdentity.mockResolvedValue({ kind: "ready", identity: IDENTITY });
    mocks.listProjects.mockResolvedValue([]);
    mocks.getMyInvites.mockResolvedValue([
      { id: "i1", projectName: "Gamma", invitedByEmail: "mara@acme.io" },
    ]);
    mocks.acceptInvite.mockResolvedValue({});

    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText("Gamma")).toBeInTheDocument();
    await user.click(screen.getByTestId("invite-accept-i1"));
    expect(mocks.acceptInvite).toHaveBeenCalledWith("i1");
  });

  it("renders the empty state when there are no projects", async () => {
    primeVault();
    mocks.ensureIdentity.mockResolvedValue({ kind: "ready", identity: IDENTITY });
    mocks.getMyInvites.mockResolvedValue([]);
    mocks.listProjects.mockResolvedValue([]);

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText(/no projects yet/i)).toBeInTheDocument();
  });

  it("shows the locked panel until the vault is unlocked", () => {
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByTestId("projects-unlock")).toBeInTheDocument();
  });
});
