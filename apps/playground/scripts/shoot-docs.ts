/**
 * Headless screenshots of the docs blocks for a design round: `pnpm shoot:docs <round>`. Writes to
 * .rounds/docs-kit-round-<n>/blocks/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots: the article, home and changelog pages in both themes and modes
 * at desktop and phone width, plain and motion, plus search and the phone navigation open.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
const out = join(here, '..', '..', '..', '.rounds', `docs-kit-round-${round}`, 'blocks');
mkdirSync(out, { recursive: true });

async function settle(page: Page) {
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
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
  await page.goto(`${base}?view=docs&${query}`);
  await settle(page);
  return page;
}

async function full(page: Page, file: string) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    scrollTo(0, 0);
  });
  await settle(page);
  await page.screenshot({ path: join(out, file), fullPage: true });
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
  for (const pageName of ['article', 'home', 'changelog']) {
    for (const theme of ['default', 'ledger']) {
      for (const mode of ['light', 'dark']) {
        for (const phone of [false, true]) {
          for (const motion of phone ? ['off'] : ['off', 'on']) {
            const query = `page=${pageName}&theme=${theme}&mode=${mode}&motion=${motion}`;
            const page = await open(browser, base, query, phone);
            const file = `${pageName}-${theme}-${mode}-${phone ? 'phone' : 'desktop'}${motion === 'on' ? '-motion' : ''}.png`;
            await full(page, file);
            await page.close();
          }
        }
      }
    }
  }
  const searchPage = await open(browser, base, 'theme=default&mode=light', false);
  await searchPage.keyboard.press('ControlOrMeta+k');
  await searchPage.waitForTimeout(250);
  await searchPage.keyboard.type('retry');
  await searchPage.waitForTimeout(500);
  await searchPage.screenshot({ path: join(out, 'search-default-light.png') });
  await searchPage.close();
  const nav = await open(browser, base, 'theme=ledger&mode=dark', true);
  await nav.getByRole('button', { name: 'Navigation' }).click();
  await nav.waitForTimeout(500);
  await nav.screenshot({ path: join(out, 'phone-nav-ledger-dark.png') });
  await nav.close();
  console.log(`docs blocks shots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
