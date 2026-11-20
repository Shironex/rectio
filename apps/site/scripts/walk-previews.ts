/**
 * Walks every live template preview in the built site, headless: `pnpm --filter @rectio/site
 * walk-previews`. Build first. For each template it opens every page template.json lists (dynamic
 * routes resolved like the viewer does), fails on a console error, a page error or a request that
 * does not load, checks that no link leaves the preview, and follows a few links on each page. It
 * serves out/ itself (PORT, default 4310) and never touches the screen.
 */
import { join } from 'node:path';

import { chromium, type Page } from 'playwright';

import { previewPages, previewUrl } from '../lib/previews.ts';
import { readTemplates } from '../lib/templates.ts';
import { serveStatic } from './static-server.ts';

const site = join(import.meta.dirname, '..');
const { server, url: origin } = await serveStatic(
  join(site, 'out'),
  Number(process.env.PORT ?? 4310),
);
const browser = await chromium.launch();
const problems: string[] = [];
let visited = 0;
let followed = 0;

/** Every way a page can fail quietly: logged errors, thrown errors, assets that do not arrive. */
function watch(page: Page, where: () => string) {
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`${where()}: console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`${where()}: page error: ${error.message}`));
  page.on('requestfailed', (request) => {
    // A navigation that replaces a page cancels its pending prefetches: not a failure.
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    problems.push(`${where()}: failed: ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(origin)) {
      problems.push(`${where()}: ${String(response.status())} ${response.url()}`);
    }
  });
}

try {
  for (const template of readTemplates()) {
    const base = `/preview/${template.name}`;
    const pages = previewPages(template.name, template.pages);
    const skipped = template.pages.filter((route) => !pages.some((p) => p.route === route));
    for (const route of skipped) problems.push(`${template.name}: no built page for ${route}`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const page = await context.newPage();
    let at = '';
    watch(page, () => `${template.name} ${at}`);
    for (const { path } of pages) {
      at = path;
      const expect404 = path === '/404';
      const response = await page.goto(origin + previewUrl(template.name, path), {
        waitUntil: 'networkidle',
      });
      if (!expect404 && (response?.status() ?? 0) >= 400) continue;
      visited += 1;
      // No link may lead out of the preview onto the site.
      const escapes = await page.$$eval(
        'a[href^="/"]',
        (links, prefix) =>
          links
            .map((a) => a.getAttribute('href') ?? '')
            .filter(
              (href) => !href.startsWith('//') && href !== prefix && !href.startsWith(`${prefix}/`),
            ),
        base,
      );
      for (const href of new Set(escapes))
        problems.push(`${template.name} ${path}: link leaves the preview: ${href}`);
      // Follow up to three visible links inside the preview, one fresh load each.
      const targets = await page.$$eval(
        'a[href]',
        (links, prefix) =>
          links
            .filter((a) => {
              const href = a.getAttribute('href') ?? '';
              const box = a.getBoundingClientRect();
              return (
                href.startsWith(`${prefix}/`) &&
                !href.includes('#') &&
                box.width > 0 &&
                box.height > 0
              );
            })
            .map((a) => a.getAttribute('href') ?? ''),
        base,
      );
      const picks = [...new Set(targets)].slice(0, 3);
      for (const href of picks) {
        await page.goto(origin + previewUrl(template.name, path), { waitUntil: 'networkidle' });
        at = `${path} -> ${href}`;
        await page.locator(`a[href="${href}"]:visible`).first().click();
        await page.waitForLoadState('networkidle');
        const landed = new URL(page.url()).pathname;
        if (!landed.startsWith(base)) problems.push(`${template.name} ${at}: landed on ${landed}`);
        const missing = await page.getByText('This page could not be found').count();
        if (missing > 0) problems.push(`${template.name} ${at}: not found page`);
        followed += 1;
      }
      at = path;
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`walk-previews: ${String(visited)} pages, ${String(followed)} links followed`);
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
}
