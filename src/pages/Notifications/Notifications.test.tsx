// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, setAccessToken } from "@/auth/tokenStore";
import { renderWithProviders } from "@/test/utils";
import { COLLABORATION_KEYS } from "./catalogue";

const mocks = vi.hoisted(() => ({
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  getNotificationPreferences: mocks.getNotificationPreferences,
  updateNotificationPreferences: mocks.updateNotificationPreferences,
  listProjects: mocks.listProjects,
  // Read by the shell header's invite badge.
  getMyInvites: vi.fn(() => Promise.resolve([])),
  getCurrentUser: vi.fn(() => Promise.resolve({ id: "u1", email: "mara@acme.io" })),
}));

import { NotificationsPage } from "./index";

const ALL_ON = Object.fromEntries(COLLABORATION_KEYS.map((key) => [key, true]));

function preferences(overrides: Record<string, boolean> = {}) {
  return { preferences: { ...ALL_ON, ...overrides } };
}

/** The first row's switch, whatever the row is called. */
function switchFor(key: string) {
  return within(screen.getByTestId(`notifications-row-${key}`)).getByRole("switch");
}

beforeEach(() => {
  setAccessToken("token");
  mocks.getNotificationPreferences.mockResolvedValue(preferences());
  mocks.updateNotificationPreferences.mockImplementation((body) =>
    Promise.resolve(preferences(body.preferences)),
  );
  mocks.listProjects.mockResolvedValue([{ id: "p1", name: "atlas" }]);
});

afterEach(() => {
  clearAccessToken();
  vi.clearAllMocks();
});

describe("NotificationsPage", () => {
  it("lists every security notice as locked, with no switch", async () => {
    renderWithProviders(<NotificationsPage />);

    await screen.findByText("Recovery code used");
    expect(screen.getAllByText("locked on")).toHaveLength(6);
    // Six locked notices + seven collaboration rows + the master toggle: the
    // locked ones contribute no switch at all.
    await waitFor(() => expect(screen.getAllByRole("switch")).toHaveLength(8));
  });

  /**
   * The one guarantee the page exists to make visible. A security notice must
   * not be reachable by any control here, not even a disabled one.
   */
  it("offers no way to switch off a security notice", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />);

    await screen.findByText("Account deleted");
    for (const label of ["Recovery code used", "Master password changed", "Account deleted"]) {
      const row = screen.getByText(label).closest("div[class]");
      expect(within(row as HTMLElement).queryByRole("switch")).toBeNull();
    }
    expect(mocks.updateNotificationPreferences).not.toHaveBeenCalled();
    await user.click(screen.getByText("Recovery code used"));
    expect(mocks.updateNotificationPreferences).not.toHaveBeenCalled();
  });

  it("sends only the toggled key", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />);

    await waitFor(() =>
      expect(switchFor("inviteDeclined")).toHaveAttribute("aria-checked", "true"),
    );
    await user.click(switchFor("inviteDeclined"));

    await waitFor(() =>
      expect(mocks.updateNotificationPreferences).toHaveBeenCalledWith({
        preferences: { inviteDeclined: false },
      }),
    );
  });

  it("shows the master toggle as mixed when only some are on", async () => {
    mocks.getNotificationPreferences.mockResolvedValue(preferences({ roleChanged: false }));
    renderWithProviders(<NotificationsPage />);

    await waitFor(() =>
      expect(screen.getByTestId("notifications-master-switch")).toHaveAttribute(
        "aria-checked",
        "mixed",
      ),
    );
    expect(screen.getByTestId("notifications-count")).toHaveTextContent("6 / 7");
  });

  it("writes all seven keys in one request from the master toggle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />);

    await waitFor(() =>
      expect(screen.getByTestId("notifications-master-switch")).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );
    await user.click(screen.getByTestId("notifications-master-switch"));

    await waitFor(() => expect(mocks.updateNotificationPreferences).toHaveBeenCalledTimes(1));
    const body = mocks.updateNotificationPreferences.mock.calls[0][0];
    expect(Object.keys(body.preferences)).toHaveLength(7);
    expect(Object.values(body.preferences)).toEqual(Array(7).fill(false));
  });

  it("explains what still happens when everything is off", async () => {
    mocks.getNotificationPreferences.mockResolvedValue(
      preferences(Object.fromEntries(COLLABORATION_KEYS.map((key) => [key, false]))),
    );
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByText(/you will only see them inside wharf/i)).toBeInTheDocument();
    // Not a warning: opting out is a legitimate choice.
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("tells a new account its settings do not apply yet", async () => {
    mocks.listProjects.mockResolvedValue([]);
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByText(/not part of any project yet/i)).toBeInTheDocument();
  });

  it("hides the no-projects note once the account is in a project", async () => {
    renderWithProviders(<NotificationsPage />);

    await screen.findByText("Project invite");
    expect(screen.queryByText(/not part of any project yet/i)).toBeNull();
  });

  /**
   * A toggle that stayed where the user put it after a failed write would be
   * claiming a setting the server never accepted.
   */
  it("snaps the switch back and reports the failure on that row when the write fails", async () => {
    const user = userEvent.setup();
    mocks.updateNotificationPreferences.mockRejectedValue(new Error("offline"));
    renderWithProviders(<NotificationsPage />);

    await waitFor(() => expect(switchFor("projectInvite")).toHaveAttribute("aria-checked", "true"));
    await user.click(switchFor("projectInvite"));

    await screen.findByRole("alert");
    expect(switchFor("projectInvite")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("notifications-row-projectInvite")).toHaveAttribute(
      "data-status",
      "error",
    );
  });

  it("leaves the other rows untouched when one write fails", async () => {
    const user = userEvent.setup();
    mocks.updateNotificationPreferences.mockRejectedValue(new Error("offline"));
    renderWithProviders(<NotificationsPage />);

    await waitFor(() => expect(switchFor("projectInvite")).toHaveAttribute("aria-checked", "true"));
    await user.click(switchFor("projectInvite"));
    await screen.findByRole("alert");

    expect(screen.getByTestId("notifications-row-roleChanged")).toHaveAttribute(
      "data-status",
      "idle",
    );
    expect(switchFor("roleChanged")).toHaveAttribute("aria-checked", "true");
  });

  it("retries the same value from the failed row", async () => {
    const user = userEvent.setup();
    mocks.updateNotificationPreferences.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<NotificationsPage />);

    await waitFor(() =>
      expect(switchFor("projectDeleted")).toHaveAttribute("aria-checked", "true"),
    );
    await user.click(switchFor("projectDeleted"));
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: /retry/ }));

    await waitFor(() => expect(mocks.updateNotificationPreferences).toHaveBeenCalledTimes(2));
    expect(mocks.updateNotificationPreferences.mock.calls[1][0]).toEqual({
      preferences: { projectDeleted: false },
    });
    await waitFor(() =>
      expect(switchFor("projectDeleted")).toHaveAttribute("aria-checked", "false"),
    );
  });

  it("surfaces a failed load with a way to try again", async () => {
    mocks.getNotificationPreferences.mockRejectedValue(new Error("offline"));
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load/i);
  });
});
