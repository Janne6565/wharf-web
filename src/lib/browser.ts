// Small browser-side helpers for the recovery-code screen: copy to clipboard,
// download as a .txt file, and print. All are no-ops / rejections outside a
// browser so SSR never touches them.

export async function copyToClipboard(text: string): Promise<void> {
  await globalThis.navigator.clipboard.writeText(text);
}

export function downloadTextFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// printText opens a minimal print window containing just the code, so the user
// can print the recovery code without the surrounding UI.
export function printText(title: string, contents: string): void {
  const printWindow = globalThis.open("", "_blank", "width=600,height=400");
  if (!printWindow) return;
  const safe = contents.replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;"));
  printWindow.document.write(
    `<!doctype html><html><head><title>${title}</title></head><body style="font-family:monospace;padding:40px;font-size:18px;letter-spacing:2px;white-space:pre-wrap">${safe}</body></html>`,
  );
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
