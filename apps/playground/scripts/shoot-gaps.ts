/**
 * Headless screenshots of the kit fixes for a design round: `pnpm shoot:gaps <round> [filter]`.
 * Writes to .rounds/round-<n>/gaps/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots, at desktop (1440) and phone (390) width in every mode: the
 * fixes page (table filters, sheet sizes, field errors, skeleton widths, loading buttons, date
 * formats), the table filters filtered, empty and with the facet menu open, the large and full
 * sheets, the command menu open at its top and scrolled to the middle, the app shell's sidebar, the
 * forms page (toggles) and the blocks that changed. Logs phone overflow and the smallest touch
 * target. `SHOOT_PORT` pins the Vite port, for lanes that share a machine.
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'gaps');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const WIDTHS = [
  ['desktop', false],
  ['phone', true],
] as const;
/** The finance blocks this round changed, with any extra query a shot needs. */
const BLOCKS: [name: string, query: string][] = [
  ['sessions', 'block=sessions'],
  ['sessions-alone', 'block=sessions&empty=1'],
  ['notifications-center', 'block=notifications-center'],
  ['kanban-board', 'block=kanban-board'],
  ['kpi-row', 'block=kpi-row'],
];

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

/** A full-height shot that keeps touch emulation (fullPage drops `pointer: coarse` for a moment). */
async function tall(page: Page, file: string) {
  const width = page.viewportSize()?.width ?? 1440;
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height });
  await settle(page);
  await page.screenshot({ path: join(out, file) });
}

const server = await createServer({
  root: join(here, '..'),
  server: {
    port: Number(process.env.SHOOT_PORT ?? 0),
    strictPort: process.env.SHOOT_PORT !== undefined,
  },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

const browser = await chromium.launch();
try {
  for (const mode of MODES) {
    const scope = `mode=${mode}`;
    for (const [width, phone] of WIDTHS) {
      const name = `${width}-${mode}`;

      if (wanted(`fixes-${name}`)) {
        const page = await open(browser, base, `view=gaps&${scope}`, phone);
        if (phone && mode === 'light') {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          console.log('fixes phone horizontal overflow px', overflow);
          console.log('fixes phone smallest touch target', await smallestTouchTarget(page));
        }
        await tall(page, `fixes-${name}.png`);
        await page.close();
      }

      for (const filter of ['some', 'nothing'] as const) {
        if (!wanted(`filters-${filter}-${name}`)) continue;
        const page = await open(browser, base, `view=gaps&filter=${filter}&${scope}`, phone);
        await page
          .locator('section', { hasText: 'Table filters' })
          .first()
          .screenshot({
            path: join(out, `filters-${filter}-${name}.png`),
          });
        await page.close();
      }

      if (wanted(`filters-menu-${name}`)) {
        const page = await open(browser, base, `view=gaps&filter=some&${scope}`, phone);
        await page.getByRole('button', { name: /^Status, 2 selected/ }).click();
        await page.getByRole('menu').waitFor();
        await settle(page);
        await page.screenshot({ path: join(out, `filters-menu-${name}.png`) });
        await page.close();
      }

      for (const size of ['lg', 'full'] as const) {
        if (!wanted(`sheet-${size}-${name}`)) continue;
        const page = await open(browser, base, `view=gaps&sheet=${size}&${scope}`, phone);
        await page.getByRole('dialog').waitFor();
        await settle(page);
        await page.screenshot({ path: join(out, `sheet-${size}-${name}.png`) });
        await page.close();
      }

      if (wanted(`forms-${name}`)) {
        const page = await open(browser, base, `view=forms&${scope}`, phone);
        await tall(page, `forms-${name}.png`);
        await page.close();
      }

      if (wanted(`command-${name}`)) {
        const page = await open(browser, base, `view=gaps&open=command&${scope}`, phone);
        await page.getByRole('dialog').waitFor();
        await settle(page);
        await page.screenshot({ path: join(out, `command-top-${name}.png`) });
        await page.evaluate(() => {
          const list = document.querySelector('[data-slot="command-list"]');
          if (list !== null) list.scrollTop = (list.scrollHeight - list.clientHeight) / 2;
        });
        await settle(page);
        await page.screenshot({ path: join(out, `command-middle-${name}.png`) });
        await page.close();
      }

      if (!phone && wanted(`sidebar-${name}`)) {
        const page = await open(browser, base, `view=shell&${scope}`, phone);
        await page.screenshot({ path: join(out, `sidebar-${name}.png`) });
        await page.close();
      }

      for (const [block, query] of BLOCKS) {
        if (!wanted(`${block}-${name}`)) continue;
        // The extra status views once per width, in light.
        if (block.endsWith('-alone') && mode !== 'light') {
          continue;
        }
        const page = await open(browser, base, `view=blocks&${query}&${scope}`, phone);
        if (phone && mode === 'light') {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          console.log(`${block} phone horizontal overflow px`, overflow);
        }
        await tall(page, `${block}-${name}.png`);
        await page.close();
      }
    }
  }

  if (wanted('motion')) {
    const page = await open(browser, base, 'view=gaps&theme=default&mode=light&motion=on', false);
    await tall(page, 'fixes-motion-default-light.png');
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
