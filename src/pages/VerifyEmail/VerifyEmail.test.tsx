// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  establishSession: vi.fn(),
  getPendingVerificationEmail: vi.fn(() => "deniz@acme.io" as string | null),
  clearPendingVerificationEmail: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => ({}),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("@/api/wharf", () => ({
  verifyEmail: mocks.verifyEmail,
  resendVerification: mocks.resendVerification,
}));
vi.mock("@/auth/session", () => ({ establishSession: mocks.establishSession }));
vi.mock("@/auth/verificationHandoff", () => ({
  getPendingVerificationEmail: mocks.getPendingVerificationEmail,
  clearPendingVerificationEmail: mocks.clearPendingVerificationEmail,
}));

import { VerifyEmailPage } from "./index";

afterEach(() => vi.clearAllMocks());

describe("VerifyEmailPage", () => {
  it("shows the address the code was sent to and no back link", () => {
    renderWithProviders(<VerifyEmailPage />);

    expect(screen.getByRole("heading", { name: /verify your email/i })).toBeInTheDocument();
    expect(screen.getByText(/deniz@acme.io/)).toBeInTheDocument();
    expect(screen.queryByTestId("back-link")).not.toBeInTheDocument();
  });

  it("keeps the submit button disabled until a code is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailPage />);

    expect(screen.getByTestId("verify-submit")).toBeDisabled();
    await user.type(screen.getByTestId("verify-code"), "123456");
    expect(screen.getByTestId("verify-submit")).toBeEnabled();
  });

  it("rejects a code that is not six digits without calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailPage />);

    await user.type(screen.getByTestId("verify-code"), "12ab");
    await user.click(screen.getByTestId("verify-submit"));

    expect(await screen.findByText(/the code is 6 digits/i)).toBeInTheDocument();
    expect(mocks.verifyEmail).not.toHaveBeenCalled();
  });

  it("verifies the code, establishes the session and continues onboarding", async () => {
    mocks.verifyEmail.mockResolvedValue({
      accessToken: "access",
      user: { id: "u1", email: "deniz@acme.io" },
    });
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailPage />);

    await user.type(screen.getByTestId("verify-code"), "123456");
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() =>
      expect(mocks.verifyEmail).toHaveBeenCalledWith({
        email: "deniz@acme.io",
        code: "123456",
        tokenMode: "COOKIE",
      }),
    );
    expect(mocks.establishSession).toHaveBeenCalledWith("access", {
      id: "u1",
      email: "deniz@acme.io",
    });
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: "/device",
        search: { onboarding: true },
      }),
    );
    expect(mocks.clearPendingVerificationEmail).toHaveBeenCalled();
  });

  it("uses the ?email= param and leaves onboarding off when deep-linked", async () => {
    mocks.verifyEmail.mockResolvedValue({ accessToken: "access" });
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailPage email="blocked@acme.io" />);

    await user.type(screen.getByTestId("verify-code"), "123456");
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() =>
      expect(mocks.verifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: "blocked@acme.io" }),
      ),
    );
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: "/device",
        search: { onboarding: false },
      }),
    );
  });

  it("shows one generic message for any rejected code", async () => {
    mocks.verifyEmail.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { code: "invalid_verification_code" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<VerifyEmailPage />);

    await user.type(screen.getByTestId("verify-code"), "123456");
    await user.click(screen.getByTestId("verify-submit"));

    expect(await screen.findByText(/that code is not valid or has expired/i)).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("confirms a resend and disables the button for the 60s backend cooldown", async () => {
    // Fake timers drive the countdown, so this one test uses fireEvent instead
    // of userEvent (whose internal delays deadlock against them).
    vi.useFakeTimers();
    mocks.resendVerification.mockResolvedValue(undefined);
    renderWithProviders(<VerifyEmailPage />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-resend"));
    });

    expect(mocks.resendVerification).toHaveBeenCalledWith({ email: "deniz@acme.io" });
    expect(screen.getByTestId("verify-resend")).toBeDisabled();
    expect(screen.getByTestId("verify-resend")).toHaveTextContent("60s");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(59_000);
    });
    expect(screen.getByTestId("verify-resend")).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(screen.getByTestId("verify-resend")).toBeEnabled();
    expect(screen.getByTestId("verify-resent")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
