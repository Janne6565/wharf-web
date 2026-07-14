import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { clearPendingRecoveryCode, getPendingRecoveryCode } from "@/auth/recoveryHandoff";
import { formatRecoveryGroups } from "@/crypto";
import { copyToClipboard, downloadTextFile, printText } from "@/lib/browser";

const RECOVERY_FILENAME = "wharf-recovery-code.txt";
const COPIED_RESET_MS = 2000;

// Drives the "Save your recovery code" screen. The code comes from the in-memory
// handoff (never persisted); the guard guarantees it exists when this renders.
export function useRecoveryCodeLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code] = useState(() => getPendingRecoveryCode() ?? "");
  const [stored, setStored] = useState(false);
  const [copied, setCopied] = useState(false);

  const groups = formatRecoveryGroups(code);
  const grouped = groups.join("-");
  const fileContents = `${t("recovery.fileHeading")}\n\n${grouped}\n`;

  const handleCopy = useCallback(async () => {
    await copyToClipboard(grouped);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [grouped]);

  const handleDownload = useCallback(() => {
    downloadTextFile(RECOVERY_FILENAME, fileContents);
  }, [fileContents]);

  const handlePrint = useCallback(() => {
    printText(t("recovery.title"), grouped);
  }, [grouped, t]);

  const handleContinue = useCallback(() => {
    clearPendingRecoveryCode();
    void navigate({ to: "/device" });
  }, [navigate]);

  return {
    groups,
    stored,
    setStored,
    copied,
    handleCopy,
    handleDownload,
    handlePrint,
    handleContinue,
  };
}
