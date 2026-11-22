/**
 * Headless screenshots of the analytics view (funnel, heatmap, waterfall, radial gauge and the
 * analytics blocks) for a design round: `pnpm shoot:viz <round> [filter]`. Writes to
 * .rounds/round-<n>/viz/ at the repo root (gitignored). Starts its own Vite server and never touches
 * the screen. Shots: desktop and phone in both modes, every skin, the motion add-on part way and
 * settled, reduced motion, and close-ups of keyboard focus, a tooltip and an opened table, plus the
 * browser checks (horizontal overflow, smallest touch target).
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'viz');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const FREEZE_AT = 420;
/** The lane's port range starts here; Vite moves up if it is taken. */
const PORT = 4440;

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

async function freeze(page: Page) {
  await page.evaluate((at) => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming().iterations !== Infinity) continue;
      animation.pause();
      animation.currentTime = at;
    }
  }, FREEZE_AT);
}

async function open(
  browser: Browser,
  base: string,
  query: string,
  options: { phone?: boolean; reducedMotion?: boolean; height?: number } = {},
) {
  const width = options.phone === true ? 390 : 1440;
  const page = await browser.newPage({
    viewport: { width, height: options.height ?? (options.phone === true ? 844 : 900) },
    deviceScaleFactor: options.phone === true ? 2 : 1,
    ...(options.phone === true ? { isMobile: true, hasTouch: true } : {}),
    ...(options.reducedMotion === true ? { reducedMotion: 'reduce' as const } : {}),
  });
  await page.goto(`${base}?view=viz&${query}`);
  await settle(page);
  return page;
}

async function shoot(
  browser: Browser,
  base: string,
  name: string,
  query: string,
  options: { phone?: boolean; reducedMotion?: boolean } = {},
) {
  if (!wanted(name)) return null;
  const page = await open(browser, base, query, options);
  await scrollThrough(page);
  const width = options.phone === true ? 390 : 1440;
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(400);
  await settle(page);
  await freeze(page);
  await page.screenshot({ path: join(out, `${name}.png`) });
  return page;
}

const server = await createServer({
  root: join(here, '..'),
  server: { port: PORT, strictPort: false },
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
    const phone = await shoot(browser, base, `phone-${mode}`, `mode=${mode}`, { phone: true });
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
  for (const [skin, mode] of [
    ['dense', 'light'],
    ['editorial', 'dark'],
    ['glass', 'light'],
    ['brutalist', 'light'],
  ] as const) {
    const page = await shoot(browser, base, `desktop-${mode}-${skin}`, `mode=${mode}&skin=${skin}`);
    await page?.close();
  }

  const moving = await shoot(browser, base, 'desktop-motion', 'motion=on');
  await moving?.close();
  const calm = await shoot(browser, base, 'desktop-reduced-motion', 'motion=on', {
    reducedMotion: true,
  });
  await calm?.close();

  for (const mode of MODES) {
    if (!wanted(`states-${mode}`)) continue;
    // The entrance part way: the charts section scrolled into view, shot shortly after.
    const entering = await open(browser, base, `motion=on&mode=${mode}`, { height: 1000 });
    const section = entering.getByRole('heading', { name: 'Funnel, heatmap, waterfall and gauge' });
    await section.scrollIntoViewIfNeeded();
    await entering.evaluate(() => {
      window.scrollBy(0, -16);
    });
    await entering.waitForTimeout(160);
    await entering.screenshot({ path: join(out, `state-entrance-${mode}.png`) });
    await entering.close();

    const page = await open(browser, base, `mode=${mode}`, { height: 1000 });
    const cards = page.locator('[data-slot="chart-card"]');
    const retention = cards.filter({ hasText: 'Logo retention' });
    await retention.scrollIntoViewIfNeeded();
    await retention.getByRole('gridcell').first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(80);
    await retention.screenshot({ path: join(out, `state-keyboard-${mode}.png`) });

    const deploys = cards.filter({ hasText: 'Deploys' });
    await deploys.scrollIntoViewIfNeeded();
    const cell = deploys.getByRole('gridcell').nth(200);
    await cell.hover();
    await page.waitForTimeout(80);
    await deploys.screenshot({ path: join(out, `state-hover-heatmap-${mode}.png`) });

    const bridge = cards.filter({ hasText: 'Cash bridge' });
    await bridge.scrollIntoViewIfNeeded();
    const plot = bridge.locator('.recharts-wrapper');
    const box = await plot.boundingBox();
    if (box !== null) {
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6);
      await page.waitForTimeout(120);
      await bridge.screenshot({ path: join(out, `state-tooltip-${mode}.png`) });
    }
    await page.mouse.move(0, 0);
    const funnel = cards.filter({ hasText: 'Trial funnel' });
    await funnel.getByRole('button', { name: 'Show table' }).click();
    await funnel.screenshot({ path: join(out, `state-table-${mode}.png`) });
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
