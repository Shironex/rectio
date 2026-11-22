/**
 * Headless screenshots of the people blocks for a design round: `pnpm shoot:people <round> [filter]`.
 * Writes to .rounds/round-<n>/people/ at the repo root (gitignored). Starts its own Vite server on
 * SHOOT_PORT (4440 by default) and never touches the screen. Shots, at desktop (1440) and phone
 * (390) width in light and dark: the timesheet as drafted, under review and in clock entry, leave
 * with the request form, the org chart of 1,240 people (and a search that reveals someone), the
 * payroll run with exceptions and approved, and the loading and empty states. Then the timesheet,
 * org chart and payroll in the dense, editorial, glass and brutalist skins. Logs phone overflow and
 * the smallest touch target.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

import { smallestTouchTarget } from './checks.ts';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
/** Optional second argument: only shots whose file name contains it, for a quick look. */
const only = process.argv[3];
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'people');
mkdirSync(out, { recursive: true });
const PORT = Number(process.env.SHOOT_PORT ?? 4440);

const MODES = ['light', 'dark'] as const;
const WIDTHS = [
  ['desktop', false],
  ['phone', true],
] as const;
const STATES = [
  'timesheet',
  'timesheet-review',
  'timesheet-clock',
  'leave',
  'leave-form',
  'org',
  'payroll',
  'payroll-approved',
  'loading',
  'empty',
] as const;
const wanted = (name: string) => only === undefined || name.includes(only);

/** Wait until the view has drawn and no finite animation is running. */
async function settle(page: Page) {
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
}

async function open(browser: Browser, base: string, query: string, phone: boolean) {
  const page = await browser.newPage({
    viewport: { width: phone ? 390 : 1440, height: phone ? 844 : 900 },
    deviceScaleFactor: phone ? 2 : 1,
    ...(phone ? { isMobile: true, hasTouch: true } : {}),
  });
  await page.goto(`${base}?${query}`);
  await settle(page);
  return page;
}

async function report(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  console.log(`${label} phone horizontal overflow px`, overflow);
  console.log(`${label} phone smallest touch target`, await smallestTouchTarget(page));
}

const server = await createServer({
  root: join(here, '..'),
  server: { port: PORT, strictPort: true },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

const browser = await chromium.launch();
try {
  for (const mode of MODES) {
    for (const [width, phone] of WIDTHS) {
      const name = `${width}-${mode}`;
      for (const state of STATES) {
        if (!wanted(`${state}-${name}`)) continue;
        const page = await open(browser, base, `view=people&state=${state}&mode=${mode}`, phone);
        if (phone && mode === 'light') await report(page, state);
        await page.screenshot({ path: join(out, `${state}-${name}.png`), fullPage: true });
        // The org chart: search for someone deep in the tree and reveal them.
        if (state === 'org' && wanted(`org-search-${name}`)) {
          await page.getByRole('searchbox', { name: 'Find a person' }).fill('Kaito');
          await settle(page);
          await page.screenshot({ path: join(out, `org-search-${name}.png`), fullPage: true });
          await page.locator('[data-slot="org-results"] button').first().click();
          await settle(page);
          await page.screenshot({ path: join(out, `org-revealed-${name}.png`), fullPage: true });
        }
        // The timesheet with a cell in focus shows its note under the grid.
        if (state === 'timesheet' && wanted(`timesheet-note-${name}`)) {
          // On a phone the days are folded: open Tuesday first.
          if (phone) await page.getByRole('button', { name: /^Tue 24 Nov/ }).click();
          await page
            .getByRole('textbox', { name: /Harbor Freight portal, Build, Tuesday/ })
            .locator('visible=true')
            .first()
            .focus();
          await settle(page);
          await page.screenshot({ path: join(out, `timesheet-note-${name}.png`), fullPage: true });
        }
        await page.close();
      }
    }
  }
  for (const [state, skin, mode, phone] of [
    ['timesheet', 'dense', 'light', false],
    ['timesheet', 'editorial', 'dark', true],
    ['org', 'dense', 'dark', false],
    ['org', 'editorial', 'light', false],
    ['payroll', 'editorial', 'light', false],
    ['payroll', 'glass', 'dark', false],
    ['leave', 'brutalist', 'light', false],
    ['leave-form', 'glass', 'light', true],
    ['timesheet-review', 'brutalist', 'dark', false],
  ] as const) {
    const name = `skin-${skin}-${state}-${phone ? 'phone' : 'desktop'}-${mode}`;
    if (!wanted(name)) continue;
    const page = await open(
      browser,
      base,
      `view=people&state=${state}&mode=${mode}&skin=${skin}`,
      phone,
    );
    await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
    await page.close();
  }
  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
