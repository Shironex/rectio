/**
 * Headless screenshots of the AI blocks for a design round: `pnpm shoot:ai-blocks <round> [filter]`.
 * Writes to .rounds/round-<n>/ai-blocks/ at the repo root (gitignored). Starts its own Vite server
 * on SHOOT_PORT (4440 by default) and never touches the screen. Shots, at desktop (1440) and phone
 * (390) width in light and dark: the chat workspace (with the list sheet open on a phone), its empty
 * and loading states, the assistant sidebar open in an app shell and folded to its rail, and the
 * prompt composer cases with the command list open. Then the workspace and sidebar in the dense,
 * editorial, glass and brutalist skins. Logs phone overflow and the smallest touch target.
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'ai-blocks');
mkdirSync(out, { recursive: true });
const PORT = Number(process.env.SHOOT_PORT ?? 4440);

const MODES = ['light', 'dark'] as const;
const WIDTHS = [
  ['desktop', false],
  ['phone', true],
] as const;
const STATES = [
  'workspace',
  'workspace-empty',
  'workspace-loading',
  'sidebar',
  'sidebar-closed',
  'composer',
] as const;

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
  server: { port: PORT, strictPort: true },
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
        const page = await open(browser, base, `view=ai-blocks&state=${state}&mode=${mode}`, phone);
        if (phone && mode === 'light') await report(page, state);
        if (state === 'composer') {
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.setViewportSize({ width: phone ? 390 : 1440, height });
          await settle(page);
        }
        await page.screenshot({ path: join(out, `${state}-${name}.png`) });
        // On a phone the list and the assistant open in sheets: shoot them open too.
        if (phone && state === 'workspace') {
          await page.getByRole('button', { name: 'Chats' }).first().click();
          await settle(page);
          await page.screenshot({ path: join(out, `workspace-list-${name}.png`) });
        }
        if (phone && state === 'sidebar-closed') {
          await page.getByRole('button', { name: 'Open assistant' }).first().click();
          await settle(page);
          await page.screenshot({ path: join(out, `sidebar-sheet-${name}.png`) });
        }
        await page.close();
      }
    }
  }
  // Skins: dense and glass on desktop light, editorial and brutalist on phone dark, and the
  // sidebar under glass and brutalist on desktop.
  for (const [state, skin, mode, phone] of [
    ['workspace', 'dense', 'light', false],
    ['workspace', 'editorial', 'dark', true],
    ['workspace', 'glass', 'light', false],
    ['workspace', 'brutalist', 'dark', true],
    ['sidebar', 'glass', 'dark', false],
    ['sidebar', 'brutalist', 'light', false],
    ['composer', 'brutalist', 'light', false],
    ['composer', 'glass', 'dark', false],
  ] as const) {
    const name = `skin-${skin}-${state}-${phone ? 'phone' : 'desktop'}-${mode}`;
    if (!wanted(name)) continue;
    const page = await open(
      browser,
      base,
      `view=ai-blocks&state=${state}&mode=${mode}&skin=${skin}`,
      phone,
    );
    await page.screenshot({ path: join(out, `${name}.png`) });
    await page.close();
  }
  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
