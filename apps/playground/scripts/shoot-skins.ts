/**
 * Headless screenshots of the same screens in every skin, for a design round:
 * `pnpm shoot:skins <round> [filter]`. Writes to .rounds/round-<n>/skins/ at the repo root
 * (gitignored). Starts its own Vite server and never touches the screen.
 *
 * Screens: the block dashboard, the settings form, the expense table, the component gallery (the
 * top of each mode's panel) and two single blocks (a SaaS pricing table and a finance invoice
 * list), each with no skin and with every shipped skin, in light and dark, at desktop (1440) and
 * phone (390) width. The first screen of each, plus browser checks per skin on the phone
 * (horizontal overflow, touch targets).
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
interface Screen {
  id: string;
  query: string;
  /** Shoot this element (from its top, at most `height` px) instead of the first screen. */
  panel?: (mode: string) => string;
}
const SCREENS: readonly Screen[] = [
  { id: 'dashboard', query: 'view=blocks' },
  { id: 'form', query: 'view=forms' },
  { id: 'table', query: 'view=app' },
  // The gallery shows both modes side by side: each shot is one mode's panel.
  { id: 'gallery', query: 'view=matrix', panel: (mode) => `[data-panel="default-${mode}"]` },
  { id: 'saas', query: 'view=blocks&block=pricing-table' },
  { id: 'finance', query: 'view=blocks&block=invoice-list' },
];
/** The tallest slice of a gallery panel a shot keeps. */
const PANEL_HEIGHT = { desktop: 1800, phone: 2400 } as const;
/** The lane's port range starts here; Vite moves up if it is taken. */
const PORT = 4440;

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
          const panel = screen.panel?.(mode);
          // The gallery shows a focus ring: the first button in the panel, reached by keyboard so
          // the browser draws :focus-visible.
          if (panel !== undefined) {
            await page.keyboard.press('Tab');
            await page.locator(`${panel} button`).first().focus();
          }
          const box = panel === undefined ? null : await page.locator(panel).boundingBox();
          await page.screenshot({
            path: join(out, `${name}.png`),
            ...(box === null
              ? {}
              : {
                  fullPage: true,
                  clip: {
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: Math.min(box.height, PANEL_HEIGHT[phone ? 'phone' : 'desktop']),
                  },
                }),
          });
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
