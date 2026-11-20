/**
 * Walks every live template preview in the built site, headless: `pnpm --filter @rectio/site
 * walk-previews`. Build first. For each template it opens every page template.json lists (dynamic
 * routes resolved like the viewer does), fails on a console error, a page error or a request that
 * does not load, checks that no link leaves the preview, and follows a few links on each page. Then
 * it opens the gallery and every viewer and checks that each frame shows its template. It serves
 * out/ itself (PORT, default 4310) and never touches the screen.
 *
 * A site built with SITE_BASE_PATH (GitHub Pages: /rectio) is walked under that base path; run
 * the walk with the same SITE_BASE_PATH.
 *
 * WALK_URL walks a running site instead, such as `pnpm dev -p 4350` with WALK_URL set to
 * http://localhost:4350, or http://localhost:4350/rectio with the base path (next dev blocks its dev resources on 127.0.0.1, so the viewer would never
 * hydrate there). WALK_SHOTS names a folder for a screenshot of every viewer.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, type Page } from 'playwright';

import { BASE_PATH, withBase } from '../lib/base-path.ts';
import { previewBase, previewPages, previewUrl } from '../lib/previews.ts';
import { readTemplates } from '../lib/templates.ts';
import { serveStatic } from './static-server.ts';

const site = join(import.meta.dirname, '..');
/** The running site's origin: every path below already carries the base path. */
const running = process.env.WALK_URL?.replace(/\/+$/, '').replace(new RegExp(`${BASE_PATH}$`), '');
const served =
  running === undefined
    ? await serveStatic(join(site, 'out'), Number(process.env.PORT ?? 4310), BASE_PATH)
    : undefined;
const origin = running ?? served?.url ?? '';
const shots = process.env.WALK_SHOTS;
if (shots !== undefined) mkdirSync(shots, { recursive: true });
/** A dev server compiles a route on its first visit: give it time. */
const TIMEOUT = 120_000;
const browser = await chromium.launch();
const problems: string[] = [];
let visited = 0;
let followed = 0;
let viewed = 0;

/** Every way a page can fail quietly: logged errors, thrown errors, assets that do not arrive. */
function watch(page: Page, where: () => string) {
  page.on('console', (message) => {
    // A Base UI misuse warning is a bug as much as an error is.
    if (message.type() === 'error' || message.text().includes('nativeButton')) {
      problems.push(`${where()}: console ${message.type()}: ${message.text()}`);
    }
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
    const base = previewBase(template.name);
    const pages = previewPages(template.name, template.pages);
    const skipped = template.pages.filter((route) => !pages.some((p) => p.route === route));
    for (const route of skipped) problems.push(`${template.name}: no built page for ${route}`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    context.setDefaultTimeout(TIMEOUT);
    context.setDefaultNavigationTimeout(TIMEOUT);
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
  await walkViewers();
} finally {
  await browser.close();
  served?.server.close();
}

/** The gallery, then each viewer: its frame must load the template's home, not a not found page. */
async function walkViewers() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  context.setDefaultTimeout(TIMEOUT);
  context.setDefaultNavigationTimeout(TIMEOUT);
  const page = await context.newPage();
  let at = '/templates';
  watch(page, () => `site ${at}`);
  await page.goto(origin + withBase(at), { waitUntil: 'load' });
  for (const template of readTemplates()) {
    if (
      (await page.locator(`a[href="${withBase(`/templates/${template.name}`)}"]`).count()) === 0
    ) {
      problems.push(`site /templates: no link to the ${template.name} viewer`);
    }
  }
  if (shots !== undefined) await page.screenshot({ path: join(shots, 'templates.png') });
  for (const template of readTemplates()) {
    at = `/templates/${template.name}`;
    await page.goto(origin + withBase(at), { waitUntil: 'load' });
    const frame = page.locator('iframe[title]').first().contentFrame();
    // The viewer reveals the frame once its page has loaded and its look is set.
    const shown = await page
      .locator('iframe[title].opacity-100')
      .waitFor()
      .then(() => true)
      .catch(() => false);
    if (!shown) {
      problems.push(`site ${at}: the frame never loaded`);
      continue;
    }
    const handle = await page.locator('iframe[title]').first().elementHandle();
    const content = await handle.contentFrame();
    const framed = content ? new URL(content.url()).pathname : '';
    if (!framed.startsWith(previewBase(template.name))) {
      problems.push(`site ${at}: the frame shows ${framed}`);
    }
    if ((await frame.getByText('This page could not be found').count()) > 0) {
      problems.push(`site ${at}: the frame shows a not found page`);
    }
    const title = (await content?.title()) ?? '';
    if (title === '' || title.includes('404')) problems.push(`site ${at}: frame title "${title}"`);
    if (shots !== undefined) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(shots, `viewer-${template.name}.png`) });
    }
    viewed += 1;
  }
  await context.close();
}

console.log(
  `walk-previews: ${String(visited)} pages, ${String(followed)} links followed, ${String(viewed)} viewers on ${origin}${BASE_PATH}`,
);
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
}
