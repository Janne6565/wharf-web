import { useCallback, useState } from "react";
import { copyToClipboard } from "@/lib/browser";
import { INSTALL_COMMAND } from "@/lib/install";

const COPIED_RESET_MS = 1600;

// Drives the hero's install-command copy button: copies the one-liner and flips
// a brief `copied` flag so the button can show feedback before resetting.
export function useLandingLogic() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(INSTALL_COMMAND);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, []);

  return { copied, handleCopy };
}
