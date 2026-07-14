import { isAxiosError } from "axios";

// Extracts the HTTP status from an unknown error thrown by the Axios client, so
// logic hooks can branch on 401 / 409 / 429 without importing Axios types.
export function getHttpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}
