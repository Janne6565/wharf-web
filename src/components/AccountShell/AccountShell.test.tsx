// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  getMyInvites: vi.fn(() => Promise.resolve([])),
  getCurrentUser: vi.fn(() => Promise.resolve({ id: "u1", email: "mara@acme.io" })),
}));

import { AccountShell } from "./index";

/**
 * These assert on layout classes, which is unusual — but the bug they cover is
 * purely a layout one and invisible to every other kind of test: the nav used to
 * stretch to the height of whatever sat beside it, so navigating between a short
 * panel and a tall one resized the navigation itself.
 */
describe("AccountShell", () => {
  function renderShell(children: React.ReactNode = <div style={{ height: 2000 }} />) {
    renderWithProviders(<AccountShell active="overview">{children}</AccountShell>);
    const nav = screen.getByRole("navigation", { name: "account settings" });
    return { nav, row: nav.parentElement as HTMLElement };
  }

  it("does not let the nav stretch to the height of the panel beside it", () => {
    const { nav, row } = renderShell();

    // Either end of the same contract: the row opts its children out of the
    // default stretch, and the nav pins itself to the start.
    expect(row.className).toContain("md:items-start");
    expect(nav.className).toContain("md:self-start");
  });

  it("draws the divider on the panel, so the nav's height is nobody else's business", () => {
    const { nav, row } = renderShell();
    const panel = row.lastElementChild as HTMLElement;

    expect(panel.className).toContain("md:border-l");
    expect(nav.className).not.toContain("border-r");
  });

  it("pins the frame to the top rather than centring it", () => {
    renderShell();

    const main = document.querySelector("main") as HTMLElement;
    // Vertical centring makes a tall page and a short page start at different
    // offsets, which moves the header and the nav on every navigation.
    expect(main.className).toContain("justify-start");
    expect(main.className).not.toContain("justify-center");
  });

  it("marks the active section for assistive tech", () => {
    renderShell();

    expect(screen.getByTestId("account-nav-overview")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("account-nav-notifications")).not.toHaveAttribute("aria-current");
  });
});
