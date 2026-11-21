/**
 * Writes text to the clipboard: the Clipboard API where the page may use it, otherwise a hidden
 * text area and the copy command, for an insecure origin or an older browser. Rejects when
 * neither works, such as when the browser blocks clipboard access.
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Missing on an insecure origin, though the types say it is always there.
  if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Denied or unavailable here: fall through to the copy command.
    }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  // Off screen and out of the accessibility tree, and kept from scrolling the page or zooming iOS.
  area.setAttribute('aria-hidden', 'true');
  Object.assign(area.style, { position: 'fixed', top: '0', left: '-9999px', fontSize: '16px' });
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.append(area);
  area.select();
  let copied: boolean;
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the only way to copy where the Clipboard API is missing or blocked; still supported by every browser
    copied = document.execCommand('copy');
  } finally {
    area.remove();
    focused?.focus();
  }
  if (!copied) throw new Error('Copying to the clipboard is not allowed here');
}
