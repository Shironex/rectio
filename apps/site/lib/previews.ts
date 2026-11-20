import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

import type { PreviewPage } from './previews-url.ts';
import { routeMatches } from './viewer.ts';

/** Where scripts/previews.ts puts each template's static build; the site build serves them. */
export const PREVIEWS_DIR = join(process.cwd(), '.previews');

export { previewBase, previewUrl, type PreviewPage } from './previews-url.ts';

/** Every route a static build holds: `invoices.html` and `invoices/index.html` are `/invoices`. */
function builtRoutes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => {
      const rel = join(entry.parentPath, entry.name).slice(dir.length).split(sep).join('/');
      const route = rel.replace(/\.html$/, '').replace(/\/index$/, '');
      return route === '' ? '/' : route;
    })
    .filter((route) => !route.startsWith('/_'))
    .sort();
}

/**
 * The template's pages with each dynamic route resolved to the first matching page of its build, so
 * the viewer opens a real record. Without a build (a site dev server before `previews` ran), a
 * dynamic route has no example yet and is left out.
 */
export function previewPages(name: string, routes: readonly string[]): PreviewPage[] {
  const dir = join(PREVIEWS_DIR, name);
  const built = existsSync(dir) ? builtRoutes(dir) : [];
  return routes.flatMap((route) => {
    const path = route.includes('[') ? built.find((p) => routeMatches(route, p)) : route;
    if (path === undefined) return [];
    return [{ route, path, label: pageLabel(dir, route, path) }];
  });
}

/** `Invoices | Fernhill Finance` is `Invoices`; the first page is Home whatever its title says. */
function pageLabel(dir: string, route: string, path: string): string {
  if (route === '/') return 'Home';
  const file = [join(dir, `${path}.html`), join(dir, path, 'index.html')].find((f) =>
    existsSync(f),
  );
  const title =
    file === undefined
      ? undefined
      : /<title>([^<]*)<\/title>/.exec(readFileSync(file, 'utf8'))?.[1];
  const label = title?.split(' | ')[0]?.trim();
  return label === undefined || label === '' ? route : decodeEntities(label);
}

const decodeEntities = (text: string) =>
  text
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

/** Marks a page as prepared, so running the step twice changes nothing. */
const MARK = 'data-rectio-preview';
const NOINDEX = `<meta name="robots" content="noindex, nofollow" ${MARK}=""/>`;

/**
 * Kit links that are plain `<a href="/...">` (the marketing blocks render no router link yet) do
 * not know the base path. This keeps them inside the preview: it prefixes them in the page as it
 * hydrates, and any the app renders later, before they can be followed.
 */
const linkGuard = (base: string) =>
  `<script>(function(){var b=${JSON.stringify(base)},o={subtree:true,childList:true,attributes:true};o.attributeFilter=[String("href")];function f(a){var h=a.getAttribute("href");if(h&&h.charAt(0)==="/"&&h.charAt(1)!=="/"&&h!==b&&h.indexOf(b+"/")!==0)a.setAttribute("href",b+h)}new MutationObserver(function(l){l.forEach(function(m){if(m.type==="attributes"){if(m.target.tagName==="A")f(m.target);return}m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.tagName==="A")f(n);n.querySelectorAll('a[href^="/"]').forEach(f)})})}).observe(document,o)})()</script>`;

/**
 * A preview page as the site serves it: marked noindex (the docs are what search should find),
 * with root-relative `<a>` links moved under the base path and the guard for links rendered later.
 */
export function prepareHtml(html: string, base: string): string {
  if (html.includes(MARK)) return html;
  const linked = html.replace(
    /(<a\b[^>]*?\shref=")(\/(?!\/)[^"]*)"/g,
    (match, head: string, href: string) =>
      href === base || href.startsWith(`${base}/`) ? match : `${head}${base}${href}"`,
  );
  // A page Next already marks noindex (its 404) keeps that tag; the guard still goes in.
  const robots = linked.includes('<meta name="robots"') ? `<meta ${MARK}=""/>` : NOINDEX;
  return linked.replace('<head>', `<head>${robots}${linkGuard(base)}`);
}
