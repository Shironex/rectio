/**
 * Headless screenshots of the scheduling pieces for a design round: `pnpm shoot:scheduling <round>
 * [filter]`. Writes to .rounds/round-<n>/scheduling/ at the repo root (gitignored). Starts its own
 * Vite server on port 4420 and never touches the screen. Shots, at desktop (1440) and phone (390)
 * width in light and dark: the whole page, the week agenda, the day view, the cards, the time
 * fields and the range calendar, an empty week, a hovered slot and a focused event. Logs phone
 * overflow and the smallest touch target.
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
const only = process.argv[3];
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'scheduling');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const WIDTHS = [
  ['desktop', false],
  ['phone', true],
] as const;
const PARTS = ['agenda', 'day', 'cards', 'time', 'range'] as const;

const wanted = (name: string) => only === undefined || name.includes(only);

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

async function tall(page: Page, file: string) {
  const width = page.viewportSize()?.width ?? 1440;
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height });
  await settle(page);
  await page.screenshot({ path: join(out, file) });
}

const server = await createServer({
  root: join(here, '..'),
  server: { port: 4420, strictPort: false },
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
      const query = `view=scheduling&mode=${mode}`;

      if (wanted(`page-${name}`) || PARTS.some((part) => wanted(`${part}-${name}`))) {
        const page = await open(browser, base, query, phone);
        if (phone && mode === 'light') {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          console.log('scheduling phone horizontal overflow px', overflow);
          console.log('scheduling phone smallest touch target', await smallestTouchTarget(page));
        }
        for (const part of PARTS) {
          if (!wanted(`${part}-${name}`)) continue;
          await page
            .locator(`[data-shot="${part}"]`)
            .screenshot({ path: join(out, `${part}-${name}.png`) });
        }
        if (wanted(`page-${name}`)) await tall(page, `page-${name}.png`);
        await page.close();
      }

      if (wanted(`empty-${name}`)) {
        const page = await open(browser, base, `${query}&empty=1`, phone);
        await page
          .locator('[data-shot="agenda"]')
          .screenshot({ path: join(out, `empty-${name}.png`) });
        await page.close();
      }

      // Pointer and keyboard states, on desktop only: a hovered empty slot and a focused event.
      if (!phone && wanted(`states-${name}`)) {
        const page = await open(browser, base, query, phone);
        const slots = page.locator('[data-shot="agenda"] [data-slot="week-agenda-slots"]').nth(3);
        const box = await slots.boundingBox();
        if (box !== null) await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.62);
        await page.locator('[data-shot="agenda"] [data-agenda-stop]').first().focus();
        await page.keyboard.press('ArrowRight');
        await settle(page);
        await page
          .locator('[data-shot="agenda"]')
          .screenshot({ path: join(out, `states-${name}.png`) });
        await page.close();
      }
    }
  }

  // The dense skin, which shortens the agenda hour, on the element an app would set it on.
  if (wanted('dense')) {
    const page = await open(browser, base, 'view=scheduling&mode=light&skin=dense', false);
    await page
      .locator('[data-shot="agenda"]')
      .screenshot({ path: join(out, 'dense-agenda-desktop-light.png') });
    await page.close();
  }

  // Keyboard states of the form pieces: a focused time segment and a range previewed by arrows.
  if (wanted('keys')) {
    const page = await open(browser, base, 'view=scheduling&mode=light', false);
    await page.locator('[data-shot="time"] [role="spinbutton"]').first().focus();
    await page.keyboard.press('ArrowUp');
    await page.locator('[data-shot="time"]').screenshot({ path: join(out, 'keys-time.png') });
    const range = page.locator('[data-shot="range"]');
    const days = range.locator('[role="gridcell"] button:not([disabled])');
    await days.nth(9).click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await settle(page);
    await range.screenshot({ path: join(out, 'keys-range.png') });
    await page.close();
  }

  if (wanted('motion')) {
    const page = await open(browser, base, 'view=scheduling&mode=light&motion=on', false);
    await page
      .locator('[data-shot="agenda"]')
      .screenshot({ path: join(out, 'motion-desktop-light.png') });
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
