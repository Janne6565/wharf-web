// In-memory holder for the short-lived identity (access) token. Per AUTH.md the
// access token lives only in memory (never localStorage, so XSS can't read a
// persisted copy); durability across reloads comes from the httpOnly refresh
// cookie plus a silent refresh on app load. The refresh interceptor updates
// this store directly, so a 401-triggered rotation is transparent to callers.

let accessToken: string | null = null;
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) {
    listener(token);
  }
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

// subscribe lets the Redux layer mirror token changes (e.g. a silent refresh)
// into UI auth state. Returns an unsubscribe function.
export function subscribeToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
