// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UnlockedVault } from "@/crypto";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({ republishLocalKey: vi.fn() }));

vi.mock("@/vault/identity", () => ({ republishLocalKey: mocks.republishLocalKey }));

import { KeyMismatchNotice } from "./index";

const LOCAL = "Zmh6 rfhi vXds j8GL";
const SERVER = "cs1u hCLE B/tt CYaQ";

const VAULT = {
  dek: new Uint8Array(0),
  payload: new TextEncoder().encode('{"schema":2,"hosts":[]}'),
  params: {},
} as unknown as UnlockedVault;

function renderNotice() {
  return renderWithProviders(
    <KeyMismatchNotice vault={VAULT} localFingerprint={LOCAL} serverFingerprint={SERVER} />,
  );
}

afterEach(() => vi.clearAllMocks());

describe("KeyMismatchNotice", () => {
  it("warns about the mismatch and shows both labelled fingerprints", () => {
    renderNotice();

    expect(screen.getByText(/does not match the one in this vault/i)).toBeInTheDocument();
    expect(screen.getByText(/may be going to someone else/i)).toBeInTheDocument();
    expect(screen.getByText(/do not accept project invites/i)).toBeInTheDocument();
    expect(screen.getByTestId("key-fingerprint-local")).toHaveTextContent(LOCAL);
    expect(screen.getByTestId("key-fingerprint-server")).toHaveTextContent(SERVER);
    expect(screen.getByText("in this vault")).toBeInTheDocument();
    expect(screen.getByText("published by the server")).toBeInTheDocument();
  });

  it("is not dismissable", () => {
    renderNotice();
    expect(screen.queryByRole("button", { name: /dismiss|close/i })).not.toBeInTheDocument();
  });

  it("requires an explicit acknowledgement before republishing the local key", async () => {
    mocks.republishLocalKey.mockResolvedValue({});
    const user = userEvent.setup();
    renderNotice();

    await user.click(screen.getByTestId("key-mismatch-republish-open"));
    expect(await screen.findByTestId("key-mismatch-republish-modal")).toBeInTheDocument();
    // The consequence of rotate: true is spelled out before the action.
    expect(screen.getByText(/resets every wrapped project key on the server/i)).toBeInTheDocument();
    expect(screen.getByText(/no new key is created/i)).toBeInTheDocument();
    expect(screen.getAllByText(/re-enter awaiting-access/i).length).toBeGreaterThan(0);

    // Unacknowledged: the confirm is dead and nothing is sent.
    await user.click(screen.getByTestId("key-mismatch-republish-confirm"));
    expect(mocks.republishLocalKey).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("key-mismatch-acknowledge"));
    await user.click(screen.getByTestId("key-mismatch-republish-confirm"));

    expect(mocks.republishLocalKey).toHaveBeenCalledWith(VAULT);
    await waitFor(() =>
      expect(screen.queryByTestId("key-mismatch-republish-modal")).not.toBeInTheDocument(),
    );
  });

  it("surfaces a failure alert when the republish errors", async () => {
    mocks.republishLocalKey.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderNotice();

    await user.click(screen.getByTestId("key-mismatch-republish-open"));
    await user.click(screen.getByTestId("key-mismatch-acknowledge"));
    await user.click(screen.getByTestId("key-mismatch-republish-confirm"));

    expect(await screen.findByText(/couldn't republish your key/i)).toBeInTheDocument();
  });

  it("cancels without republishing", async () => {
    const user = userEvent.setup();
    renderNotice();

    await user.click(screen.getByTestId("key-mismatch-republish-open"));
    await user.click(screen.getByTestId("key-mismatch-republish-cancel"));

    await waitFor(() =>
      expect(screen.queryByTestId("key-mismatch-republish-modal")).not.toBeInTheDocument(),
    );
    expect(mocks.republishLocalKey).not.toHaveBeenCalled();
  });
});
