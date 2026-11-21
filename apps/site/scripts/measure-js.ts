/**
 * `pnpm --filter @rectio/site measure-js [path ...]`: how much JavaScript a page of the built site
 * costs, measured four ways so runs can be compared. Build first. Earlier figures disagreed because
 * each counted a different one of these.
 *
 * - html: the module scripts the exported HTML references (script src and script preloads; the
 *   nomodule polyfills are left out, as modern browsers never fetch them).
 * - first load: what the browser fetched on a cold load at 1440 by 900 once the network went quiet,
 *   without scrolling, with prefetching of other routes blocked: the page's own first screen.
 * - with prefetch: the same load with Next's link prefetching allowed, which adds the code of the
 *   routes that visible links point to. It is fetched at low priority and never run on this page.
 * - scrolled: the first-load session after scrolling to the end, so every deferred part loaded.
 *
 * Sizes are gzip at level 9 of the files in out/ (or SITE_OUT), as a CDN compresses them. Writes
 * nothing.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { chromium } from 'playwright';

import { BASE_PATH } from '../lib/base-path.ts';
import { serveStatic } from './static-server.ts';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
// SITE_OUT measures another export, such as one built from main, for a before and after.
const out = process.env.SITE_OUT ?? join(site, 'out');
const paths = process.argv.slice(2);
const PAGES = paths.length > 0 ? paths : ['/', '/docs/components/data-table', '/templates'];

const gzipKb = (file: string) =>
  gzipSync(readFileSync(join(out, decodeURIComponent(file))), { level: 9 }).length / 1024;

const sumKb = (files: Iterable<string>) => {
  let total = 0;
  for (const file of files) total += gzipKb(file);
  return total;
};

/** The scripts the exported HTML of a route references, as site paths without the base path. */
function htmlScripts(route: string): Set<string> {
  const file = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}.html`;
  const html = readFileSync(join(out, file), 'utf8');
  const found = new Set<string>();
  const patterns = [
    /<script(?![^>]*nomodule)[^>]*\ssrc="([^"]+\.js)"/gi,
    /<link[^>]*\shref="([^"]+\.js)"[^>]*as="script"/g,
    /<link[^>]*as="script"[^>]*\shref="([^"]+\.js)"/g,
  ];
  for (const pattern of patterns)
    for (const [, src] of html.matchAll(pattern))
      if (src !== undefined) found.add(src.slice(BASE_PATH.length));
  return found;
}

const served = await serveStatic(out, 0, BASE_PATH);
const browser = await chromium.launch();
const rows: Record<string, Record<string, string>> = {};

try {
  for (const route of PAGES) {
    const html = htmlScripts(route);
    const visit = async (prefetch: boolean, scroll: boolean) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      // Route prefetches go through the routes' RSC payloads (.txt); without them nothing is prefetched.
      if (!prefetch) await page.route(/\.txt(\?.*)?$/, (request) => request.abort());
      const fetched = new Set<string>();
      page.on('response', (response) => {
        if (response.request().resourceType() !== 'script') return;
        fetched.add(new URL(response.url()).pathname.slice(BASE_PATH.length));
      });
      await page.goto(served.url + BASE_PATH + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const first = new Set(fetched);
      if (scroll) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 600) {
          await page.evaluate((top) => {
            scrollTo({ top, behavior: 'instant' });
          }, y);
          await page.waitForTimeout(150);
        }
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
      await context.close();
      return { first, all: fetched };
    };
    const own = await visit(false, true);
    const linked = await visit(true, false);
    const fmt = (files: Set<string>) => `${sumKb(files).toFixed(1)} kB (${String(files.size)})`;
    rows[route] = {
      html: fmt(html),
      'first load': fmt(own.first),
      'with prefetch': fmt(linked.first),
      scrolled: fmt(own.all),
    };
  }
  console.log('gzip -9 kB of JavaScript (file count)');
  console.table(rows);
} finally {
  await browser.close();
  served.server.close();
}
