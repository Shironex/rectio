/**
 * Headless screenshots of the AI and chat pack for a design round: `pnpm shoot:chat <round> [filter]`.
 * Writes to .rounds/round-<n>/chat/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots, at desktop (1440) and phone (390) width in light and dark: the
 * conversation at its latest reply and scrolled to the top, the empty thread with suggestions, a
 * reply caught mid stream, a failed message, and the parts page. Logs phone overflow and the
 * smallest touch target.
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'chat');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const WIDTHS = [
  ['desktop', false],
  ['phone', true],
] as const;
const STATES = ['conversation', 'empty', 'streaming', 'error'] as const;

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
  server: { port: 4401, strictPort: true },
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
        const page = await open(browser, base, `view=chat&state=${state}&mode=${mode}`, phone);
        if (phone && mode === 'light') await report(page, state);
        await page.screenshot({ path: join(out, `${state}-${name}.png`) });
        if (state === 'conversation') {
          await page.evaluate(() => {
            const log = document.querySelector('[role="log"]');
            if (log !== null) log.scrollTop = 0;
          });
          await page.getByRole('button', { name: 'Jump to latest' }).waitFor();
          await settle(page);
          await page.screenshot({ path: join(out, `conversation-top-${name}.png`) });
        }
        await page.close();
      }
      if (wanted(`parts-${name}`)) {
        const page = await open(browser, base, `view=chat&state=parts&mode=${mode}`, phone);
        if (phone && mode === 'light') await report(page, 'parts');
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: phone ? 390 : 1440, height });
        await settle(page);
        await page.screenshot({ path: join(out, `parts-${name}.png`) });
        await page.close();
      }
    }
  }
  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
