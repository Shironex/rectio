/**
 * The address as a browser reads it: surrounding spaces trimmed and the tabs and line breaks that
 * browsers drop from inside a URL removed, so ` //host` or `/\t/host` cannot pass as a path.
 */
function normalize(href: string): string {
  return href.trim().replace(/[\t\n\r]/g, '');
}

/**
 * Whether an address leaves the app: it names a scheme (`https:`, `mailto:`, `tel:`) or a host.
 * A host is two slashes in any mix with backslashes (`//cdn.example`, `/\evil.example`), since
 * browsers read a backslash as a slash; an address that starts with a backslash at all is treated
 * as leaving too. Such links are always plain anchors, never the router's link. Plain function, no
 * React: a server can run it too.
 */
export function isExternalHref(href: string): boolean {
  const address = normalize(href);
  return /^[a-z][a-z\d+.-]*:/i.test(address) || /^(\\|[/\\]{2})/.test(address);
}

/** Whether an address only moves within the page, such as `#pricing`. */
export function isHashHref(href: string): boolean {
  return normalize(href).startsWith('#');
}
