/**
 * Headless screenshots of the charts for a design round: `pnpm shoot:charts <round>`.
 * Writes to .rounds/round-<n>/charts/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots: the whole view at desktop width and at phone width in every mode,
 * the motion add-on, reduced motion, the entrance part way, a tooltip, keyboard focus, an update
 * and the table twin, plus
 * browser checks (horizontal overflow, smallest touch target). Looping animations are paused at the
 * same moment in every shot, so rounds compare like with like.
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'charts');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
/** Where looping animations are frozen, in ms: mid-cycle, so every loader shows its shape. */
const FREEZE_AT = 420;

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

/** Scroll the whole page through once, so first-view entrances run before a full-page shot. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await settle(page);
}

/** Pause every looping animation at the same point of its own timeline. */
async function freeze(page: Page) {
  await page.evaluate((at) => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = at;
    }
  }, FREEZE_AT);
}

async function shoot(
  browser: Browser,
  base: string,
  name: string,
  query: string,
  options: { width?: number; phone?: boolean; reducedMotion?: boolean } = {},
) {
  if (!wanted(name)) return null;
  const width = options.width ?? (options.phone === true ? 390 : 1440);
  const page = await browser.newPage({
    viewport: { width, height: options.phone === true ? 844 : 900 },
    deviceScaleFactor: options.phone === true ? 2 : 1,
    ...(options.phone === true ? { isMobile: true, hasTouch: true } : {}),
    ...(options.reducedMotion === true ? { reducedMotion: 'reduce' as const } : {}),
  });
  await page.goto(`${base}?view=charts&${query}`);
  await settle(page);
  await scrollThrough(page);
  // A viewport as tall as the page, not `fullPage`, so touch sizes stay in the picture.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height });
  await settle(page);
  await freeze(page);
  await page.screenshot({ path: join(out, `${name}.png`) });
  return page;
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
    const desk = await shoot(browser, base, `desktop-${mode}`, `mode=${mode}`);
    await desk?.close();
    const phone = await shoot(browser, base, `phone-${mode}`, `mode=${mode}`, {
      phone: true,
    });
    if (phone !== null) {
      await phone.setViewportSize({ width: 390, height: 844 });
      console.log(
        `phone ${mode}: overflow px`,
        await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
        'smallest touch target',
        await smallestTouchTarget(phone),
      );
      await phone.close();
    }
  }
  const moving = await shoot(browser, base, 'desktop-motion', 'motion=on');
  await moving?.close();
  const calm = await shoot(browser, base, 'desktop-reduced-motion', 'motion=on', {
    reducedMotion: true,
  });
  await calm?.close();

  // The entrance part way through, and the interactions: tooltip, keyboard focus, the table twin.
  for (const mode of MODES) {
    if (!wanted(`states-${mode}`)) continue;
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}?view=charts&motion=on&mode=${mode}`);
    await page.waitForFunction(() => document.querySelectorAll('.recharts-surface').length > 0);
    await page.waitForTimeout(140);
    await page.screenshot({ path: join(out, `state-entrance-${mode}.png`) });
    await settle(page);
    const plot = page.locator('[data-slot="chart-card"]').first().locator('.recharts-wrapper');
    const box = await plot.boundingBox();
    if (box !== null) {
      await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5);
      await page.waitForTimeout(120);
      await page.screenshot({
        path: join(out, `state-tooltip-${mode}.png`),
        clip: { x: box.x - 40, y: box.y - 140, width: box.width + 80, height: box.height + 180 },
      });
    }
    await page.mouse.move(0, 0);
    const bars = page.locator('[data-slot="chart-card"]').nth(2);
    await bars.locator('.recharts-surface').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
    await bars.screenshot({ path: join(out, `state-keyboard-${mode}.png`) });
    // The update glide: sample one bar's height in the page itself, so a busy machine cannot hide it.
    const heights = bars.locator('.recharts-bar-rectangle path').first();
    const before = await heights.getAttribute('d');
    await bars.getByRole('button', { name: 'Forecast' }).click();
    const samples = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const seen: string[] = [];
          const start = performance.now();
          const tick = () => {
            const path = document
              .querySelectorAll('[data-slot="chart-card"]')[2]
              ?.querySelector('.recharts-bar-rectangle path');
            seen.push(path?.getAttribute('d')?.split(' ').slice(0, 3).join(' ') ?? '');
            if (performance.now() - start < 400) requestAnimationFrame(tick);
            else resolve(seen);
          };
          tick();
        }),
    );
    console.log(
      `${mode} update glide: ${String(new Set(samples).size)} distinct frames over 400 ms (from ${before?.split(' ').slice(0, 3).join(' ') ?? ''})`,
    );
    // The mid-update still: the glide slowed to 3 s on a page of its own, so the shot lands inside it.
    const slow = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await slow.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '[data-slot="chart-card"] { --rx-motion-duration-slow: 3s; }';
        document.head.append(style);
      });
    });
    await slow.goto(`${base}?view=charts&motion=on&mode=${mode}`);
    await slow.waitForFunction(() => document.querySelectorAll('.recharts-surface').length > 0);
    const slowBars = slow.locator('[data-slot="chart-card"]').nth(2);
    await slowBars.scrollIntoViewIfNeeded();
    // Let the slowed entrance finish before the update starts.
    await slow.waitForTimeout(7000);
    await slowBars.getByRole('button', { name: 'Forecast' }).click();
    await slow.mouse.move(0, 0);
    await slow.waitForTimeout(900);
    await slowBars.screenshot({ path: join(out, `state-update-mid-${mode}.png`) });
    await slow.close();
    await settle(page);
    await bars.getByRole('button', { name: 'Show table' }).click();
    await bars.screenshot({ path: join(out, `state-table-${mode}.png`) });
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
