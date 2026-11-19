/**
 * Headless captures of the built site. Build first (`pnpm build`), then:
 *
 * - `pnpm shoot 3` writes a design round to .rounds/saas-landing-round-3/ at the repo root: every
 *   page on desktop (1440) and phone (390), light and dark, the home and pricing pages in both
 *   themes, plus the phone menu, the cookie banner and the 404. `pnpm shoot 3 pricing` shoots one page.
 * - `pnpm shoot screenshots` refreshes screenshots/, the stills the docs and the showcase use.
 *
 * It serves out/ itself and never touches the screen.
 */
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';

import { serveStatic } from './static-server.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const arg = process.argv[2] ?? '1';
const only = process.argv[3];

const PAGES = [
  { name: 'home', path: '/', themes: ['default', 'ledger'] },
  { name: 'features', path: '/features' },
  { name: 'pricing', path: '/pricing', themes: ['default', 'ledger'] },
  { name: 'customers', path: '/customers' },
  { name: 'blog', path: '/blog' },
  { name: 'article', path: '/blog/harbour-street-rota-by-thursday' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'changelog', path: '/changelog' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: 'cookies', path: '/cookies' },
  { name: 'not-found', path: '/no-such-page' },
] as const;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
] as const;
const MODES = ['light', 'dark'] as const;

/** A saved cookie decision, so the banner stays out of every shot but its own. */
const DECIDED = JSON.stringify({
  version: '2026-11',
  decidedAt: '2026-11-19T09:00:00.000Z',
  choices: { necessary: true, analytics: false, marketing: false },
});

interface Options {
  width: number;
  height: number;
  mobile: boolean;
  mode: 'light' | 'dark';
  theme: string;
  consent?: boolean;
}

async function open(browser: Browser, base: string, path: string, options: Options) {
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.mobile ? 2 : 1,
    isMobile: options.mobile,
    hasTouch: options.mobile,
    colorScheme: options.mode,
  });
  await context.addInitScript(
    ({ theme, mode, consent, decided }) => {
      try {
        localStorage.setItem('rostra-theme', JSON.stringify({ theme, mode }));
        if (consent) localStorage.setItem('rostra-consent', decided);
      } catch {
        // A capture without storage shows the defaults.
      }
    },
    {
      theme: options.theme,
      mode: options.mode,
      consent: options.consent ?? true,
      decided: DECIDED,
    },
  );
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { context, page };
}

/** Scroll through so every reveal has run, then wait for fonts and finite animations. */
async function settle(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => innerHeight * 0.6);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => {
      scrollTo({ top, behavior: 'instant' });
    }, y);
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => {
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
    undefined,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(300);
}

const { server, url: base } = await serveStatic(join(root, 'out'));
const browser = await chromium.launch();

try {
  if (arg === 'screenshots') {
    const dir = join(root, 'screenshots');
    mkdirSync(dir, { recursive: true });
    const stills = [
      { file: 'desktop-light.png', view: VIEWPORTS[0], mode: 'light' },
      { file: 'desktop-dark.png', view: VIEWPORTS[0], mode: 'dark' },
      { file: 'phone.png', view: { ...VIEWPORTS[1], mobile: false }, mode: 'light' },
    ] as const;
    for (const still of stills) {
      const { context, page } = await open(browser, base, '/', {
        ...still.view,
        mode: still.mode,
        theme: 'default',
      });
      await settle(page);
      const path = join(dir, still.file);
      await page.screenshot({ path });
      console.log(`${still.file}: ${String(Math.round(statSync(path).size / 1024))} KB`);
      await context.close();
    }
  } else {
    if (!/^\d+$/.test(arg)) throw new Error(`round must be a number or "screenshots", got ${arg}`);
    const out = join(root, '..', '..', '.rounds', `saas-landing-round-${arg}`);
    mkdirSync(out, { recursive: true });
    let count = 0;
    for (const entry of PAGES.filter((p) => only === undefined || p.name === only)) {
      const themes = 'themes' in entry ? entry.themes : (['default'] as const);
      for (const theme of themes) {
        for (const view of VIEWPORTS) {
          for (const mode of MODES) {
            const { context, page } = await open(browser, base, entry.path, {
              ...view,
              mode,
              theme,
            });
            await settle(page);
            const file = `${entry.name}-${theme}-${view.name}-${mode}.png`;
            await page.screenshot({ path: join(out, file), fullPage: true });
            count += 1;
            await context.close();
          }
        }
      }
      // Every other page once in ledger, so the second theme is seen across the site.
      if (!('themes' in entry)) {
        const { context, page } = await open(browser, base, entry.path, {
          ...VIEWPORTS[0],
          mode: 'dark',
          theme: 'ledger',
        });
        await settle(page);
        await page.screenshot({
          path: join(out, `${entry.name}-ledger-desktop-dark.png`),
          fullPage: true,
        });
        count += 1;
        await context.close();
      }
    }
    if (only === undefined) {
      // The first visit: announcement and cookie banner, desktop and phone.
      for (const view of VIEWPORTS) {
        const { context, page } = await open(browser, base, '/', {
          ...view,
          mode: 'light',
          theme: 'default',
          consent: false,
        });
        await settle(page);
        await page.screenshot({ path: join(out, `first-visit-${view.name}.png`) });
        count += 1;
        await context.close();
      }
      // The phone menu, open, in both modes.
      for (const mode of MODES) {
        const { context, page } = await open(browser, base, '/pricing', {
          ...VIEWPORTS[1],
          mode,
          theme: 'default',
        });
        await settle(page);
        await page.getByRole('button', { name: 'Menu' }).click();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: join(out, `menu-phone-${mode}.png`) });
        count += 1;
        await context.close();
      }
    }
    console.log(`round ${arg}: ${String(count)} shots in ${out}`);
  }
} finally {
  await browser.close();
  server.close();
}
