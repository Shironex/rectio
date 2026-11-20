/**
 * Walks every page of the built template in a headless browser and fails on a console error, an
 * uncaught exception, a failed request or a link that leaves the base path. Build first, then
 * `walk`; for the preview build, `PREVIEW_BASE_PATH=/preview/saas-admin pnpm build` and
 * `walk /preview/saas-admin`, which serves out/ under that prefix only, as the previews do.
 *
 * It serves out/ itself on port 4341 and never touches the screen.
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { serveStatic } from './static-server.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'out');
/** Every customer page the export holds, so a detail page added to the data is walked too. */
const customers = readdirSync(join(out, 'customers'))
  .filter((file) => file.endsWith('.html'))
  .map((file) => file.slice(0, -'.html'.length));
const prefix = process.argv[2] ?? '';
if (prefix !== '' && !/^\/[\w/-]+[^/]$/.test(prefix))
  throw new Error(`the base path must look like /preview/saas-admin, got ${prefix}`);

const PAGES = [
  '/',
  '/tickets',
  '/customers',
  ...customers.map((id) => `/customers/${id}`),
  '/team',
  '/files',
  '/notifications',
  '/billing',
  '/developers',
  '/whats-new',
  '/settings',
  '/settings/workspace',
  '/settings/security',
  '/settings/notifications',
  '/sign-in',
  '/sign-up',
  '/two-factor',
  '/reset-password',
  '/reset-password?step=reset',
];
const STATES = ['empty', 'loading', 'error'];
const WITH_STATES = ['/', '/tickets', '/customers', '/customers/halden-roofing', '/team', '/files'];
const MORE = ['/notifications', '/billing', '/developers', '/settings', '/settings/security'];
const paths = [
  ...PAGES,
  ...[...WITH_STATES, ...MORE].flatMap((p) => STATES.map((s) => `${p}?state=${s}`)),
  '/settings/workspace?state=invalid',
  '/sign-in?state=error',
  '/two-factor?state=error',
];

const { server, url: base } = await serveStatic(out, 4341, prefix);
const origin = new URL(base).origin;
const browser = await chromium.launch();
const problems: string[] = [];

try {
  for (const mode of ['light', 'dark'] as const) {
    const context = await browser.newContext({ colorScheme: mode });
    const page = await context.newPage();
    let current = '';
    page.on('console', (message) => {
      if (message.type() === 'error')
        problems.push(`${current} [${mode}] console: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      problems.push(`${current} [${mode}] exception: ${error.message}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400)
        problems.push(`${current} [${mode}] ${String(response.status())} ${response.url()}`);
    });
    page.on('requestfailed', (request) => {
      problems.push(`${current} [${mode}] failed ${request.url()}`);
    });
    page.on('request', (request) => {
      if (!request.url().startsWith(origin) && !request.url().startsWith('data:'))
        problems.push(`${current} [${mode}] network call to ${request.url()}`);
    });
    for (const path of mode === 'light' ? paths : PAGES) {
      current = path;
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const hrefs = await page.$$eval('a[href]', (links) =>
        links.map((a) => a.getAttribute('href') ?? ''),
      );
      for (const href of hrefs) {
        if (href.startsWith('/') && !href.startsWith(`${prefix}/`) && href !== prefix)
          problems.push(`${path} link ${href} leaves the base path`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

const visited = paths.length + PAGES.length;
if (problems.length > 0) {
  for (const line of [...new Set(problems)]) console.error(line);
  console.error(`${String(problems.length)} problems over ${String(visited)} page loads`);
  process.exit(1);
}
console.log(`${String(visited)} page loads under "${prefix || '/'}", no problems`);
