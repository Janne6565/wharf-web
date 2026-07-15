// The shared Axios instance injected into every Orval-generated call. It owns
// the three cross-cutting concerns from AUTH.md so they are configured once:
//   1. base URL (relative by default; the Vite dev server proxies /api -> 8080),
//   2. attaching the in-memory Bearer identity token,
//   3. a silent refresh on 401 using the httpOnly refresh cookie, retried once.

import Axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/auth/tokenStore";

// Base origin of the backend API. Empty in dev (the Vite proxy forwards /api to
// :8080) or when same-origin in prod; set via VITE_API_URL for a cross-origin
// API. Exported so full-page OAuth redirects can build an absolute authorize URL.
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const REFRESH_PATH = "/api/v1/auth/refresh";
// Auth endpoints must never trigger the refresh-and-retry loop: a 401 from them
// is a genuine credential failure, not an expired access token.
const AUTH_PREFIX = "/api/v1/auth/";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: API_BASE,
  // Send the httpOnly refresh cookie on same-site requests (and cross-site when
  // the backend allows credentialed CORS).
  withCredentials: true,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = AXIOS_INSTANCE.post<{ accessToken?: string }>(REFRESH_PATH, {})
      .then((res) => {
        const token = res.data.accessToken ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        clearAccessToken();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall = url.startsWith(AUTH_PREFIX);

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        return AXIOS_INSTANCE(original);
      }
    }
    return Promise.reject(error);
  },
);

// customInstance is Orval's mutator: every generated endpoint calls through it.
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data as T);

  // Allow React Query to cancel in-flight requests.
  (promise as Promise<T> & { cancel?: () => void }).cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export default customInstance;

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
