import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { issueDeviceCode } from "@/api/wharf";
import { useAuthInformation } from "@/auth/useAuthInformation";

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
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const requestedOnce = useRef(false);

  const issue = useMutation({
    mutationFn: issueDeviceCode,
    onSuccess: (data) => {
      setCode(data.code ?? null);
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

  return {
    email,
    formattedCode: code ? formatCode(code) : null,
    timeLabel: formatRemaining(remainingMs),
    hasCode: code !== null,
    isIssuing: issue.isPending,
    isError: issue.isError,
    isExpired: remainingMs <= 0 && expiresAt !== null && !issue.isPending,
  };
}
