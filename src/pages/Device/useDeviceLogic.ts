import { useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { issueDeviceCode } from "@/api/wharf";
import { useAuthInformation } from "@/auth/useAuthInformation";
import { copyToClipboard } from "@/lib/browser";
import { INSTALL_COMMAND } from "@/lib/install";

const deviceRoute = getRouteApi("/device");
const COPIED_RESET_MS = 1600;

const TICK_MS = 500;
const RETRY_MS = 3000;

function formatCode(code: string): string {
  const upper = code.toUpperCase();
  return `${upper.slice(0, 4)}-${upper.slice(4, 8)}`;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Issues a device-pairing code on mount, counts down to its expiry, and
// automatically re-issues a fresh code the moment the current one lapses.
export function useDeviceLogic() {
  const { email } = useAuthInformation();
  const { onboarding } = deviceRoute.useSearch();
  const [installOpen, setInstallOpen] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const requestedOnce = useRef(false);

  const issue = useMutation({
    mutationFn: issueDeviceCode,
    onSuccess: (data) => {
      setCode(data.code ?? null);
      // A reissued code is a different code — the "copied" confirmation from the
      // previous one would otherwise claim the new one is on the clipboard.
      setCodeCopied(false);
      const expiry = data.expiresAt ? Date.parse(data.expiresAt) : null;
      setExpiresAt(expiry);
      // Seed the remaining time from the fresh expiry immediately, so the UI never
      // flashes the "expired/reissuing" state during the first tick (up to TICK_MS)
      // before the interval has run once.
      setRemainingMs(expiry ? Math.max(0, expiry - Date.now()) : 0);
    },
  });
  // Keep a stable handle so timer effects can re-issue without re-subscribing.
  const issueRef = useRef(issue.mutate);
  issueRef.current = issue.mutate;

  useEffect(() => {
    if (requestedOnce.current) return;
    requestedOnce.current = true;
    issueRef.current();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const id = globalThis.setInterval(() => {
      const remaining = expiresAt - Date.now();
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0) {
        globalThis.clearInterval(id);
        issueRef.current();
      }
    }, TICK_MS);
    return () => globalThis.clearInterval(id);
  }, [expiresAt]);

  // A failed issue (initial fetch or an expiry-triggered reissue) leaves no live
  // countdown, so the code would stay stuck. Retry on a short backoff so the page
  // self-heals; a successful retry sets a new expiresAt which restarts the timer.
  useEffect(() => {
    if (!issue.isError) return;
    const id = globalThis.setTimeout(() => issueRef.current(), RETRY_MS);
    return () => globalThis.clearTimeout(id);
  }, [issue.isError]);

  // Copied in the displayed XXXX-XXXX form: every client (TUI, mobile) strips
  // non-alphanumerics from the pairing input, so the dash is harmless and what
  // lands on the clipboard matches what is on screen.
  const formattedCode = code ? formatCode(code) : null;
  const copyCode = useCallback(async () => {
    if (!formattedCode) return;
    await copyToClipboard(formattedCode);
    setCodeCopied(true);
    globalThis.setTimeout(() => setCodeCopied(false), COPIED_RESET_MS);
  }, [formattedCode]);

  const openInstall = useCallback(() => setInstallOpen(true), []);
  const closeInstall = useCallback(() => setInstallOpen(false), []);
  const copyInstall = useCallback(async () => {
    await copyToClipboard(INSTALL_COMMAND);
    setInstallCopied(true);
    globalThis.setTimeout(() => setInstallCopied(false), COPIED_RESET_MS);
  }, []);

  return {
    email,
    onboarding,
    installOpen,
    installCopied,
    installCommand: INSTALL_COMMAND,
    openInstall,
    closeInstall,
    copyInstall,
    formattedCode,
    codeCopied,
    copyCode,
    timeLabel: formatRemaining(remainingMs),
    hasCode: code !== null,
    isIssuing: issue.isPending,
    isError: issue.isError,
    isExpired: remainingMs <= 0 && expiresAt !== null && !issue.isPending,
  };
}
