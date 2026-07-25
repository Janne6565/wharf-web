import { isAxiosError } from "axios";

// Extracts the HTTP status from an unknown error thrown by the Axios client, so
// logic hooks can branch on 401 / 409 / 429 without importing Axios types.
export function getHttpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

// The machine-readable reasons the backend puts in the Problem Details `code`
// property. Branch on these — never on `detail`, which is human-facing prose
// that may be reworded or translated at any time.
export const PROBLEM_CODES = {
  emailNotVerified: "email_not_verified",
  invalidVerificationCode: "invalid_verification_code",
} as const;

// Extracts that `code` from an unknown Axios error, so logic hooks can branch on
// the reason rather than on the status alone (a 403 can mean several things).
export function getProblemCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) {
    return undefined;
  }
  const data = error.response?.data as { code?: unknown } | undefined;
  return typeof data?.code === "string" ? data.code : undefined;
}
