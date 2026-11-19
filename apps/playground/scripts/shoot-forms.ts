/**
 * Headless screenshots of the forms view for a design round: `pnpm shoot:forms <round>`.
 * Writes to .rounds/round-<n>/forms/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots: the settings form at desktop (1440) and phone (390) width in
 * every theme and mode, open popups, the invalid state after a save, the motion variant, compact
 * density, plus browser checks (phone overflow, touch targets).
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'forms');
mkdirSync(out, { recursive: true });

const THEMES = ['default', 'ledger'] as const;
const MODES = ['light', 'dark'] as const;

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

async function open(
  browser: Browser,
  base: string,
  query: string,
  options: { phone?: boolean; reducedMotion?: boolean } = {},
) {
  const page = await browser.newPage({
    viewport: {
      width: options.phone === true ? 390 : 1440,
      height: options.phone === true ? 844 : 900,
    },
    deviceScaleFactor: options.phone === true ? 2 : 1,
    ...(options.phone === true ? { isMobile: true, hasTouch: true } : {}),
    ...(options.reducedMotion === true ? { reducedMotion: 'reduce' as const } : {}),
  });
  await page.goto(`${base}?view=forms&${query}`);
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
  server: { port: 0, strictPort: false },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

const browser = await chromium.launch();
try {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      const name = `${theme}-${mode}`;
      if (wanted(`desktop-${name}`)) {
        const page = await open(browser, base, `theme=${theme}&mode=${mode}`);
        await tall(page, `desktop-${name}.png`);
        await page.close();
      }
      if (wanted(`phone-${name}`)) {
        const page = await open(browser, base, `theme=${theme}&mode=${mode}`, { phone: true });
        if (theme === 'default' && mode === 'light') {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          console.log('phone horizontal overflow px', overflow);
          console.log('phone smallest touch target', await smallestTouchTarget(page));
        }
        await tall(page, `phone-${name}.png`);
        await page.close();
      }
    }
  }

  // Open popups and the invalid state, in one theme per mode.
  for (const [theme, mode] of [
    ['default', 'light'],
    ['ledger', 'dark'],
  ] as const) {
    const name = `${theme}-${mode}`;
    if (wanted(`popups-${name}`)) {
      const page = await open(browser, base, `theme=${theme}&mode=${mode}`);
      const timezone = page.getByRole('combobox', { name: 'Time zone' });
      await timezone.click();
      await timezone.fill('lon');
      await page.getByRole('listbox').waitFor();
      await settle(page);
      await page.screenshot({ path: join(out, `combobox-${name}.png`) });
      await page.keyboard.press('Escape');
      await page.getByRole('listbox').waitFor({ state: 'detached' });

      const notify = page.getByRole('combobox', { name: 'Notify on changes' });
      await notify.click();
      await page.getByRole('listbox').waitFor();
      await settle(page);
      await page.screenshot({ path: join(out, `multi-select-${name}.png`) });
      await page.keyboard.press('Escape');
      await page.getByRole('listbox').waitFor({ state: 'detached' });
      await page.close();
    }
    if (wanted(`invalid-${name}`)) {
      const page = await open(browser, base, `theme=${theme}&mode=${mode}&invalid=1`);
      await tall(page, `invalid-${name}.png`);
      await page.close();
    }
  }

  if (wanted('compact')) {
    const page = await open(browser, base, 'theme=default&mode=light&density=compact');
    await tall(page, 'compact-default-light.png');
    await page.close();
  }
  if (wanted('motion')) {
    const page = await open(browser, base, 'theme=ledger&mode=light&motion=on');
    await tall(page, 'motion-ledger-light.png');
    await page.close();
  }
  if (wanted('reduced')) {
    const page = await open(browser, base, 'theme=default&mode=dark&motion=on', {
      reducedMotion: true,
    });
    await tall(page, 'reduced-default-dark.png');
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
