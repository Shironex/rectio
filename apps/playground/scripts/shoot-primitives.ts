/**
 * Headless screenshots of the new primitives for a design round: `pnpm shoot:primitives <round>
 * [filter]`. Writes to .rounds/round-<n>/primitives/ at the repo root (gitignored). Starts its own
 * Vite server and never touches the screen. Shots, at desktop (1440) and phone (390) width in light
 * and dark: the page, the alert dialog open, the drawer open (a bottom sheet on the phone), the
 * tree with keyboard focus after opening a branch, a copy button in its copied state and the
 * resizable handle focused after a keyboard step. Logs phone overflow and the smallest touch target.
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'primitives');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const WIDTHS = [
  ['desktop', false],
  ['phone', true],
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

/** A full-height shot that keeps touch emulation (fullPage drops `pointer: coarse` for a moment). */
async function tall(page: Page, file: string) {
  const width = page.viewportSize()?.width ?? 1440;
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height });
  await settle(page);
  await page.screenshot({ path: join(out, file) });
}

/** A shot of one element with some room around it. */
async function around(page: Page, selector: string, file: string) {
  const box = await page.locator(selector).first().boundingBox();
  if (box === null) throw new Error(`no box for ${selector}`);
  const size = page.viewportSize() ?? { width: 1440, height: 900 };
  const pad = 24;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  await page.screenshot({
    path: join(out, file),
    clip: {
      x,
      y,
      width: Math.min(size.width - x, box.width + pad * 2),
      height: Math.min(size.height - y, box.height + pad * 2),
    },
  });
}

const server = await createServer({
  root: join(here, '..'),
  server: { port: 0, strictPort: false },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

const browser = await chromium.launch();
try {
  for (const mode of MODES) {
    const scope = `view=primitives&mode=${mode}`;
    for (const [width, phone] of WIDTHS) {
      const name = `${width}-${mode}`;

      if (wanted(`page-${name}`)) {
        const page = await open(browser, base, scope, phone);
        if (phone && mode === 'light') {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          console.log('page phone horizontal overflow px', overflow);
          console.log('page phone smallest touch target', await smallestTouchTarget(page));
        }
        await tall(page, `page-${name}.png`);
        await page.close();
      }

      if (wanted(`alert-${name}`)) {
        const page = await open(browser, base, `${scope}&open=alert`, phone);
        await page.getByRole('alertdialog').waitFor();
        await settle(page);
        const focused = await page.evaluate(() => document.activeElement?.textContent ?? '');
        if (mode === 'light') console.log(`alert ${width} first focus:`, focused);
        await page.screenshot({ path: join(out, `alert-${name}.png`) });
        // The action while its request runs.
        await page.getByRole('button', { name: 'Delete draft' }).last().click();
        await page.waitForTimeout(250);
        await page.screenshot({ path: join(out, `alert-running-${name}.png`) });
        await page.close();
      }

      if (wanted(`drawer-${name}`)) {
        const page = await open(browser, base, `${scope}&open=drawer`, phone);
        await page.getByRole('dialog').waitFor();
        await settle(page);
        await page.screenshot({ path: join(out, `drawer-${name}.png`) });
        await page.close();
      }

      if (wanted(`tree-${name}`)) {
        const page = await open(browser, base, scope, phone);
        await page.getByRole('treeitem', { name: /Liabilities/ }).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await settle(page);
        if (mode === 'light') {
          const rows = await page
            .getByRole('treeitem')
            .evaluateAll((items) =>
              items.map((item) => Math.round(item.getBoundingClientRect().height)),
            );
          console.log(`tree ${width} row heights`, [...new Set(rows)].join(', '));
        }
        await around(page, '[data-slot="tree-scroll"]', `tree-${name}.png`);
        await page.close();
      }

      if (wanted(`copy-${name}`)) {
        const page = await open(browser, base, scope, phone);
        await page.getByRole('button', { name: 'Copy IBAN' }).click();
        await page.getByRole('button', { name: 'Copy', exact: true }).click();
        await page.waitForTimeout(400);
        await around(page, 'dl', `copy-${name}.png`);
        await page.close();
      }

      if (wanted(`resizable-${name}`)) {
        const page = await open(browser, base, scope, phone);
        await page.getByRole('separator', { name: 'Resize the invoice list' }).focus();
        await page.keyboard.press(phone ? 'ArrowDown' : 'ArrowRight');
        await settle(page);
        await around(page, '[data-slot="resizable-group"]', `resizable-${name}.png`);
        await page.close();
      }
    }
  }

  if (wanted('motion')) {
    const page = await open(browser, base, 'view=primitives&mode=light&motion=on', false);
    await page.getByRole('button', { name: /^Paid/ }).click();
    await settle(page);
    await tall(page, 'page-motion-desktop-light.png');
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
