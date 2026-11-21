/**
 * Whether an address leaves the app: it names a scheme (`https:`, `mailto:`, `tel:`) or a host
 * (`//cdn.example`). Such links are always plain anchors, never the router's link. Plain function,
 * no React: a server can run it too.
 */
export function isExternalHref(href: string): boolean {
  return /^([a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

/** Whether an address only moves within the page, such as `#pricing`. */
export function isHashHref(href: string): boolean {
  return href.startsWith('#');
}
