/**
 * Headless screenshots of the same screens in every skin, for a design round:
 * `pnpm shoot:skins <round> [filter]`. Writes to .rounds/round-<n>/skins/ at the repo root
 * (gitignored). Starts its own Vite server and never touches the screen.
 *
 * Screens: the block dashboard, the settings form and the expense table, each with no skin and
 * with every shipped skin, in light and dark, at desktop (1440) and phone (390) width. The first
 * screen of each, plus browser checks per skin on the phone (horizontal overflow, touch targets).
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

import { SKINS } from '../src/themes.ts';
import { smallestTouchTarget } from './checks.ts';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
/** Optional second argument: only shots whose file name contains it, for a quick look. */
const only = process.argv[3];
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'skins');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const LOOKS = ['default', ...SKINS] as const;
const SCREENS = [
  { id: 'dashboard', query: 'view=blocks' },
  { id: 'form', query: 'view=forms' },
  { id: 'table', query: 'view=app' },
] as const;
/** The lane's port range starts here; Vite moves up if it is taken. */
const PORT = 4380;

const wanted = (name: string) => only === undefined || name.includes(only);

/** Wait until the view has drawn, its fonts have loaded and no finite animation is running. */
async function settle(page: Page) {
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
}

async function open(browser: Browser, url: string, phone: boolean) {
  const page = await browser.newPage({
    viewport: { width: phone ? 390 : 1440, height: phone ? 844 : 1000 },
    deviceScaleFactor: phone ? 2 : 1,
    ...(phone ? { isMobile: true, hasTouch: true } : {}),
  });
  await page.goto(url);
  await settle(page);
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
  for (const screen of SCREENS) {
    for (const look of LOOKS) {
      const skin = look === 'default' ? '' : `&skin=${look}`;
      for (const mode of MODES) {
        for (const phone of [false, true]) {
          const name = `${screen.id}-${look}-${phone ? 'phone' : 'desktop'}-${mode}`;
          if (!wanted(name)) continue;
          const page = await open(browser, `${base}?${screen.query}&mode=${mode}${skin}`, phone);
          if (phone && mode === 'light') {
            const overflow = await page.evaluate(
              () => document.documentElement.scrollWidth - window.innerWidth,
            );
            console.log(
              `${screen.id} ${look}: overflow ${String(overflow)}px, smallest target`,
              await smallestTouchTarget(page),
            );
          }
          await page.screenshot({ path: join(out, `${name}.png`) });
          await page.close();
        }
      }
    }
  }
  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
