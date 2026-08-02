// Carrying a "where was I going?" destination across the sign-in flow.
//
// A guard that bounces an anonymous visitor to /signin loses what they asked
// for. That is worst for /device: the TUI opens the pairing page, and landing
// on /connections after signing in leaves the terminal waiting for a code the
// user now has to go and find.

const STORAGE_KEY = "wharf-redirect-after-auth";

// safeRedirect accepts only same-origin absolute paths.
//
// The destination arrives in a URL, so it is attacker-supplied by definition —
// a ?redirect= that takes any value is the textbook open redirect, and one on a
// sign-in page is a credible phishing hop ("log in to wharf", land on a clone).
// Anything that is not a plain /path is dropped rather than sanitised.
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  // Must be rooted…
  if (!value.startsWith("/")) return undefined;
  // …but "//evil.com" and "/\evil.com" are rooted *and* protocol-relative:
  // browsers treat both as another origin.
  if (value.startsWith("//") || value.startsWith("/\\")) return undefined;
  // A control character (a tab or newline inside the path) can smuggle a scheme
  // past the checks above, because the browser strips it afterwards.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point
  if (/[\u0000-\u001F\u007F]/.test(value)) return undefined;
  return value;
}

// OAuth leaves our origin entirely: the browser goes to the backend, then the
// provider, then back to /oauth/complete, so a search param cannot survive the
// trip. sessionStorage does, and is scoped to this tab.
export function stashRedirect(target: string | undefined): void {
  const safe = safeRedirect(target);
  if (!safe) return;
  try {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, safe);
  } catch {
    // Private mode or a storage-less environment: the flow still works, it
    // just lands on the default screen.
  }
}

// takeStashedRedirect reads and clears the stashed destination — one use only,
// so a later sign-in does not inherit an old one.
export function takeStashedRedirect(): string | undefined {
  try {
    const value = globalThis.sessionStorage?.getItem(STORAGE_KEY);
    globalThis.sessionStorage?.removeItem(STORAGE_KEY);
    return safeRedirect(value);
  } catch {
    return undefined;
  }
}

// Destinations that work with a sealed vault.
//
// Pairing a terminal only authorises the device; the vault plaintext is never
// touched in the browser — the TUI downloads the account blob and opens it with
// the master password typed there. So sending someone through /unlock on the
// way to /device asks for a password to unlock something the page never reads.
//
// Everything else does need a primed vault (/connections and /projects render
// decrypted hosts), so this is an allowlist, not a heuristic.
const VAULT_FREE_PREFIXES = ["/device"];

export function needsPrimedVault(target: string | undefined): boolean {
  const safe = safeRedirect(target);
  if (!safe) return true;
  const path = safe.split(/[?#]/)[0];
  return !VAULT_FREE_PREFIXES.includes(path);
}
