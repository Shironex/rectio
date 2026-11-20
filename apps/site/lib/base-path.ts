/**
 * The path the whole site is served under: empty for local work, `/rectio` on GitHub Pages
 * (`SITE_BASE_PATH=/rectio pnpm build`). next.config passes the same value to Next's `basePath`
 * and inlines it into client code, so this module is safe to import anywhere.
 *
 * Next adds the base path to `<Link>` and its own assets by itself. Use `withBase` only for a
 * plain URL Next never sees: an `<img>` or `<iframe>` src, a raw `<a>`, a fetch.
 */
function normalize(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '');
  if (trimmed === '') return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export const BASE_PATH = normalize(process.env.SITE_BASE_PATH);

/** A root path (`/templates/x.webp`) under the base path (`/rectio/templates/x.webp`). */
export const withBase = (path: string) => `${BASE_PATH}${path}`;
