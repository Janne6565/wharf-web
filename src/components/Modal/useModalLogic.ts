import { useEffect } from "react";

// Shared modal behaviour: close on Escape and lock body scroll while open. Only
// active while `open` is true; both effects are self-cleaning. Client-only
// concerns (the modal is used on ssr:false screens), guarded for SSR/test.
export function useModalLogic(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);
}
