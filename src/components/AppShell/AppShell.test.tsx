// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  getMyInvites: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  getMyInvites: mocks.getMyInvites,
}));

import { AppShell } from "./index";

afterEach(() => {
  vi.clearAllMocks();
});

describe("AppShell", () => {
  it("links to the projects hub on both nav variants", () => {
    mocks.getMyInvites.mockResolvedValue([]);
    const { rerender } = renderWithProviders(
      <AppShell nav="account" width={640}>
        <div />
      </AppShell>,
    );
    expect(screen.getByTestId("shell-projects")).toHaveAttribute("to", "/projects");

    rerender(
      <AppShell nav="connections" width={640}>
        <div />
      </AppShell>,
    );
    expect(screen.getByTestId("shell-projects")).toBeInTheDocument();
  });

  it("badges the projects link with the pending invite count", async () => {
    mocks.getMyInvites.mockResolvedValue([{ id: "i1" }, { id: "i2" }]);
    renderWithProviders(
      <AppShell nav="account" width={640}>
        <div />
      </AppShell>,
    );
    await waitFor(() => expect(screen.getByTestId("shell-invite-badge")).toHaveTextContent("2"));
  });

  it("shows no badge when there are no invites", async () => {
    mocks.getMyInvites.mockResolvedValue([]);
    renderWithProviders(
      <AppShell nav="account" width={640}>
        <div />
      </AppShell>,
    );
    await waitFor(() => expect(mocks.getMyInvites).toHaveBeenCalled());
    expect(screen.queryByTestId("shell-invite-badge")).not.toBeInTheDocument();
  });
});
