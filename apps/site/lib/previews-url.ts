/** Where a template's live preview is served: safe to import from client components. */

/** The base path a template's preview is built under and served from. */
export const previewBase = (name: string) => `/preview/${name}`;

/** The URL of a template page inside its preview. */
export const previewUrl = (name: string, path: string) =>
  path === '/' ? `${previewBase(name)}/` : `${previewBase(name)}${path}`;

/** A page of a template as the viewer offers it: the route it declares and a real URL for it. */
export interface PreviewPage {
  /** The route as template.json lists it, dynamic segments included (`/invoices/[id]`). */
  route: string;
  /** A path that exists in the build (`/invoices/inv-2026-0216`). */
  path: string;
  /** What the page calls itself (its title, without the app's name), or the route without a build. */
  label: string;
}
