import { useCallback, useEffect, useMemo, useState } from "react";
import { copyToClipboard } from "@/lib/browser";
import { channelsForOs, detectOs, type Os } from "@/lib/install";

const COPIED_RESET_MS = 1600;

// Drives the hero's install box: picks the channels the visitor can actually
// run, tracks the selected one, and copies its command.
//
// The OS starts as "unknown" and is narrowed in an effect rather than during
// render. This page is server-rendered and the server has no user agent to go
// on, so resolving the platform during the first client render would make the
// markup disagree with the server's and break hydration. "unknown" yields the
// channels that work everywhere, so the pre-hydration paint is still useful —
// and it is what a visitor without JavaScript keeps.
export function useLandingLogic() {
  const [os, setOs] = useState<Os>("unknown");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOs(detectOs(globalThis.navigator.userAgent));
  }, []);

  const channels = useMemo(() => channelsForOs(os), [os]);

  // Falls back to the platform's first channel, so detection landing after
  // mount promotes brew/winget without the visitor touching anything. An
  // explicit choice survives that, because selectedId stays null until they
  // pick one.
  const selected = channels.find((channel) => channel.id === selectedId) ?? channels[0] ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!selected) return;
    await copyToClipboard(selected.command);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [selected]);

  return { channels, selected, copied, handleCopy, handleSelect };
}
