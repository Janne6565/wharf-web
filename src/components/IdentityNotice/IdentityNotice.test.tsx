// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({ resetIdentity: vi.fn() }));

vi.mock("@/vault/identity", () => ({ resetIdentity: mocks.resetIdentity }));

import { IdentityNotice } from "./index";

const IDENTITY = { x25519Priv: "cHJpdg==", x25519Pub: "cHVi", createdAt: "t" };

const VAULT = {
  dek: new Uint8Array(0),
  payload: new TextEncoder().encode('{"schema":1,"hosts":[]}'),
  params: {},
} as unknown as UnlockedVault;

afterEach(() => vi.clearAllMocks());

describe("IdentityNotice", () => {
  it("renders the needs-sync warning with the reset action", () => {
    renderWithProviders(<IdentityNotice vault={VAULT} />);
    expect(screen.getByText(/sync it from the device/i)).toBeInTheDocument();
    expect(screen.getByTestId("identity-reset-open")).toBeInTheDocument();
  });

  it("confirms consequences then rotates the identity on confirm", async () => {
    mocks.resetIdentity.mockResolvedValue(IDENTITY);
    const user = userEvent.setup();
    renderWithProviders(<IdentityNotice vault={VAULT} />);

    await user.click(screen.getByTestId("identity-reset-open"));
    expect(await screen.findByTestId("identity-reset-modal")).toBeInTheDocument();
    // The consequence copy spells out the awaiting-access + unrecoverable outcomes.
    expect(screen.getByText(/re-enters awaiting-access/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently unrecoverable/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("identity-reset-confirm"));
    expect(mocks.resetIdentity).toHaveBeenCalledWith(VAULT);
    // The modal closes on success.
    await waitFor(() =>
      expect(screen.queryByTestId("identity-reset-modal")).not.toBeInTheDocument(),
    );
  });

  it("surfaces a failure alert when the reset errors", async () => {
    mocks.resetIdentity.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderWithProviders(<IdentityNotice vault={VAULT} />);

    await user.click(screen.getByTestId("identity-reset-open"));
    await user.click(screen.getByTestId("identity-reset-confirm"));

    expect(await screen.findByText(/couldn't reset your identity/i)).toBeInTheDocument();
  });

  it("cancels without resetting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<IdentityNotice vault={VAULT} />);

    await user.click(screen.getByTestId("identity-reset-open"));
    expect(await screen.findByTestId("identity-reset-modal")).toBeInTheDocument();
    await user.click(screen.getByTestId("identity-reset-cancel"));

    await waitFor(() =>
      expect(screen.queryByTestId("identity-reset-modal")).not.toBeInTheDocument(),
    );
    expect(mocks.resetIdentity).not.toHaveBeenCalled();
  });
});
