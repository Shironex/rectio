/**
 * Headless screenshots of the display components for a design round: `pnpm shoot:display <round>`.
 * Writes to .rounds/round-<n>/display/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots: the whole view at desktop width and at phone width in every mode,
 * the motion add-on, reduced motion, and close-ups of the loaders and skeletons, plus
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'display');
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
  await page.goto(`${base}?view=display&${query}`);
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
  for (const section of ['loaders', 'skeletons', 'progress'] as const) {
    for (const mode of MODES) {
      const page = await shoot(
        browser,
        base,
        `closeup-${section}-${mode}`,
        `section=${section}&mode=${mode}`,
        { width: 1280 },
      );
      await page?.close();
    }
  }
  const moving = await shoot(browser, base, 'desktop-motion', 'motion=on');
  await moving?.close();
  const calm = await shoot(browser, base, 'desktop-reduced-motion', 'motion=on', {
    reducedMotion: true,
  });
  await calm?.close();

  // The loading overlay and the swap, in their other state.
  if (wanted('states')) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}?view=display&section=loaders`);
    await settle(page);
    await page.getByRole('button', { name: 'Refresh rates' }).click();
    await page.waitForTimeout(600);
    await freeze(page);
    await page.screenshot({ path: join(out, 'state-overlay.png'), fullPage: true });
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
