// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearVaultSession, setVaultSession } from "@/auth/vaultSession";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  getCurrentUser: vi.fn(),
  getVault: vi.fn(),
  ensureIdentity: vi.fn(),
  loadProjectVault: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/api/wharf", () => ({
  getProject: mocks.getProject,
  getCurrentUser: mocks.getCurrentUser,
  getVault: mocks.getVault,
  updateProject: vi.fn(),
  createInvite: vi.fn(),
  deleteInvite: vi.fn(),
  updateMemberRole: vi.fn(),
  leaveProject: vi.fn(),
  deleteProject: vi.fn(),
  rotateProject: vi.fn(),
}));
vi.mock("@/vault/identity", () => ({
  ensureIdentity: mocks.ensureIdentity,
  resetIdentity: vi.fn(),
}));
vi.mock("@/vault/projectVaultAccess", () => ({ loadProjectVault: mocks.loadProjectVault }));

import { ProjectDetailPage } from "./index";

const IDENTITY = { x25519Priv: "cHJpdg==", x25519Pub: "cHVi", createdAt: "t" };

function primeVault(): void {
  setVaultSession({
    dek: new Uint8Array(0),
    payload: new TextEncoder().encode('{"schema":2,"hosts":[]}'),
    params: {},
  } as unknown as UnlockedVault);
}

function seedOwnerView(): void {
  primeVault();
  mocks.ensureIdentity.mockResolvedValue({ kind: "ready", identity: IDENTITY });
  mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
  mocks.getProject.mockResolvedValue({
    id: "p1",
    name: "Atlas",
    description: "core api",
    role: "OWNER",
    vaultVersion: 1,
    members: [
      { userId: "u1", email: "mara@acme.io", role: "OWNER", publicKey: "k1" },
      { userId: "u2", email: "deniz@acme.io", role: "ADMIN", publicKey: "k2" },
    ],
    invites: [{ id: "i1", email: "sam@acme.io" }],
  });
  mocks.loadProjectVault.mockResolvedValue({
    awaiting: false,
    hosts: [{ id: "h1", name: "prod-api-01", user: "x", addr: "1.1.1.1", port: 22 }],
    version: 1,
  });
}

afterEach(() => {
  clearVaultSession();
  vi.clearAllMocks();
});

describe("ProjectDetailPage", () => {
  it("renders members with roles, the (you) marker, hosts and a pending invite", async () => {
    seedOwnerView();
    renderWithProviders(<ProjectDetailPage projectId="p1" />);

    expect(await screen.findByText("mara@acme.io")).toBeInTheDocument();
    expect(screen.getByText("(you)")).toBeInTheDocument();
    expect(screen.getByText("deniz@acme.io")).toBeInTheDocument();
    expect(await screen.findByText("prod-api-01")).toBeInTheDocument();
    expect(screen.getByText("sam@acme.io")).toBeInTheDocument();
    expect(screen.getByText(/invited · awaiting accept/)).toBeInTheDocument();
  });

  it("opens the invite modal with the canonical keys-stay-yours copy", async () => {
    seedOwnerView();
    const user = userEvent.setup();
    renderWithProviders(<ProjectDetailPage projectId="p1" />);

    await user.click(await screen.findByTestId("members-invite"));
    expect(await screen.findByTestId("invite-modal")).toBeInTheDocument();
    expect(screen.getByText(/Keys stay yours\./)).toBeInTheDocument();
  });

  it("asks for confirmation before removing a member", async () => {
    seedOwnerView();
    const user = userEvent.setup();
    renderWithProviders(<ProjectDetailPage projectId="p1" />);

    await user.click(await screen.findByTestId("member-remove-u2"));
    expect(await screen.findByTestId("member-confirm")).toBeInTheDocument();
    expect(screen.getByText(/Remove deniz@acme.io/)).toBeInTheDocument();
  });

  it("surfaces a not-found notice when the project is gone", async () => {
    primeVault();
    mocks.ensureIdentity.mockResolvedValue({ kind: "ready", identity: IDENTITY });
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.loadProjectVault.mockResolvedValue({ awaiting: true, hosts: [] });
    mocks.getProject.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });

    renderWithProviders(<ProjectDetailPage projectId="p1" />);
    expect(await screen.findByText(/no longer exists/i)).toBeInTheDocument();
  });

  it("surfaces the needs-sync notice instead of spinning when this vault has no identity", async () => {
    primeVault();
    mocks.ensureIdentity.mockResolvedValue({ kind: "needs-sync" });
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.getProject.mockResolvedValue({ id: "p1", name: "Atlas", role: "MEMBER", members: [] });

    renderWithProviders(<ProjectDetailPage projectId="p1" />);

    expect(await screen.findByTestId("identity-notice")).toBeInTheDocument();
    expect(screen.getByTestId("identity-reset-open")).toBeInTheDocument();
    // The hosts blob is never loaded in this state.
    expect(mocks.loadProjectVault).not.toHaveBeenCalled();
  });

  it("shows the locked panel until the vault is unlocked", () => {
    renderWithProviders(<ProjectDetailPage projectId="p1" />);
    expect(screen.getByTestId("project-unlock")).toBeInTheDocument();
  });
});
