/**
 * Headless captures of the built template. Build first (`pnpm --filter @rectio/template-finance-app
 * build`), then:
 *
 * - `shoot` writes the gallery images to screenshots/: desktop-light.webp and desktop-dark.webp
 *   (1440 by 900, the overview) and phone.webp (390 by 844 at 2x, the overview, light), each WebP
 *   encoded in the browser and kept under 300 KB.
 * - `shoot <n>` writes a design round to .rounds/templates-core-round-<n>/finance-app/ at the repo
 *   root (gitignored): every page on desktop and phone, light and dark, the empty, loading and
 *   error states, and the open overlays.
 *
 * It serves out/ itself and never touches the screen.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';

import { serveStatic } from './static-server.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const round = process.argv[2];
if (round !== undefined && !/^\d+$/.test(round))
  throw new Error(`round must be a number, got ${round}`);

/** Matches the key in components/appearance-script.ts. */
const STORAGE_KEY = 'fernhill-appearance';
const INVOICE = '/invoices/inv-2026-0198';

type Mode = 'light' | 'dark';
interface View {
  name: 'desktop' | 'phone';
  width: number;
  height: number;
  mobile: boolean;
}

const DESKTOP: View = { name: 'desktop', width: 1440, height: 900, mobile: false };
const PHONE: View = { name: 'phone', width: 390, height: 844, mobile: true };

interface Shot {
  file: string;
  path: string;
  view: View;
  mode: Mode;
  fullPage: boolean;
  /** Opens an overlay or otherwise sets the page up before the capture. */
  prepare?: (page: Page) => Promise<void>;
}

async function open(browser: Browser, base: string, shot: Shot) {
  const context = await browser.newContext({
    viewport: { width: shot.view.width, height: shot.view.height },
    deviceScaleFactor: shot.view.mobile ? 2 : 1,
    isMobile: shot.view.mobile,
    hasTouch: shot.view.mobile,
    colorScheme: shot.mode,
    reducedMotion: 'no-preference',
  });
  await context.addInitScript(
    ([key, look]) => {
      try {
        localStorage.setItem(key, look);
      } catch {
        // Without storage the capture shows the default look.
      }
    },
    [STORAGE_KEY, JSON.stringify({ mode: shot.mode })] as const,
  );
  const page = await context.newPage();
  await page.goto(base + shot.path, { waitUntil: 'networkidle' });
  return { context, page };
}

/** Waits for fonts and every finite animation, so a shot never catches a half state. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
    undefined,
    { timeout: 10_000 },
  );
}

/** Scrolls through the page so blocks that animate in on first view have all entered. */
async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => innerHeight * 0.7);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => {
      scrollTo({ top, behavior: 'instant' });
    }, y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => {
    scrollTo({ top: 0, behavior: 'instant' });
  });
}

async function capture(page: Page, shot: Shot): Promise<Buffer> {
  if (shot.fullPage) await walk(page);
  await settle(page);
  if (shot.prepare !== undefined) {
    await shot.prepare(page);
    await settle(page);
  }
  return page.screenshot({ fullPage: shot.fullPage });
}

/** Encodes a PNG as WebP in the browser, lowering the quality until it fits the budget. */
async function toWebp(page: Page, png: Buffer, maxBytes: number): Promise<Buffer> {
  for (const quality of [0.9, 0.85, 0.8, 0.72, 0.64, 0.56]) {
    const dataUrl = await page.evaluate(
      async ([src, q]) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d')?.drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', q);
      },
      [`data:image/png;base64,${png.toString('base64')}`, quality] as const,
    );
    const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    if (bytes.length <= maxBytes) return bytes;
  }
  throw new Error('Could not fit the image under the size budget');
}

const PAGES = [
  { name: 'overview', path: '/', states: true },
  { name: 'invoices', path: '/invoices', states: true },
  { name: 'invoice-detail', path: INVOICE, states: true },
  { name: 'expenses', path: '/expenses', states: true },
  { name: 'journal', path: '/journal', states: true },
  { name: 'journal-account', path: '/journal?account=1000', states: false },
  { name: 'reports', path: '/reports', states: true },
  { name: 'settings', path: '/settings', states: false },
  { name: 'sign-in', path: '/sign-in', states: false },
] as const;

const press = (keys: string) => async (page: Page) => {
  await page.keyboard.press(keys);
  await page.waitForTimeout(300);
};
const click =
  (name: RegExp, role: 'button' | 'link' = 'button') =>
  async (page: Page) => {
    await page.getByRole(role, { name }).first().click();
    await page.waitForTimeout(400);
  };

function roundShots(): Shot[] {
  const shots: Shot[] = [];
  const add = (shot: Omit<Shot, 'file'> & { name: string }) => {
    const { name, ...rest } = shot;
    shots.push({
      ...rest,
      file: `${name}-${shot.view.name}-${shot.mode}.png`,
    });
  };
  for (const entry of PAGES) {
    for (const view of [DESKTOP, PHONE]) {
      for (const mode of ['light', 'dark'] as const) {
        add({ name: entry.name, path: entry.path, view, mode, fullPage: true });
      }
    }
    if (entry.states) {
      for (const state of ['empty', 'loading', 'error'] as const) {
        add({
          name: `${entry.name}-${state}`,
          path: `${entry.path}${entry.path.includes('?') ? '&' : '?'}state=${state}`,
          view: DESKTOP,

          mode: 'light',
          fullPage: false,
        });
      }
    }
  }
  const overlay = (
    name: string,
    path: string,
    prepare: (page: Page) => Promise<void>,
    view = DESKTOP,
    mode: Mode = 'light',
  ) => {
    add({ name: `overlay-${name}`, path, view, mode, fullPage: false, prepare });
  };
  overlay('command-menu', '/', press('ControlOrMeta+k'));
  overlay('command-menu', '/', press('ControlOrMeta+k'), DESKTOP, 'dark');
  overlay('new-invoice', '/invoices', click(/^New invoice$/));
  overlay('new-invoice-invalid', '/invoices', async (page) => {
    await click(/^New invoice$/)(page);
    await page.getByRole('button', { name: 'Save draft' }).click();
    await page.waitForTimeout(300);
  });
  overlay('submit-expense', '/expenses', click(/^Submit an expense$/));
  overlay('submit-expense', '/expenses', click(/^Submit an expense$/), PHONE);
  overlay('record-payment', INVOICE, click(/^Record payment$/));
  overlay('notifications', '/', click(/^Notifications/));
  overlay('account-menu', '/', click(/^Account,/));
  overlay('appearance-menu', '/', click(/^Appearance$/));
  overlay('phone-sidebar', '/', click(/^Open navigation$/), PHONE);
  overlay('phone-sidebar', '/', click(/^Open navigation$/), PHONE, 'dark');
  overlay('rail-collapsed', '/', press('ControlOrMeta+b'));
  add({
    name: 'settings-invalid',
    path: '/settings?state=invalid',
    view: DESKTOP,

    mode: 'light',
    fullPage: true,
  });
  add({
    name: 'sign-in-error',
    path: '/sign-in?state=error',
    view: DESKTOP,

    mode: 'light',
    fullPage: false,
  });
  return shots;
}

/** Runs the shots a few at a time, each in its own browser context. */
async function runAll<T>(items: readonly T[], limit: number, task: (item: T) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      if (item !== undefined) await task(item);
    }
  });
  await Promise.all(workers);
}

const { server, url: base } = await serveStatic(join(root, 'out'));
const browser = await chromium.launch();

try {
  if (round === undefined) {
    const out = join(root, 'screenshots');
    mkdirSync(out, { recursive: true });
    const gallery: (Shot & { webp: string })[] = [
      {
        webp: 'desktop-light.webp',
        file: '',
        path: '/',
        view: DESKTOP,

        mode: 'light',
        fullPage: false,
      },
      {
        webp: 'desktop-dark.webp',
        file: '',
        path: '/',
        view: DESKTOP,

        mode: 'dark',
        fullPage: false,
      },
      {
        webp: 'phone.webp',
        file: '',
        path: '/',
        view: PHONE,

        mode: 'light',
        fullPage: false,
      },
    ];
    for (const shot of gallery) {
      const { context, page } = await open(browser, base, shot);
      const png = await capture(page, shot);
      const webp = await toWebp(page, png, 300 * 1024);
      writeFileSync(join(out, shot.webp), webp);
      console.log(`${shot.webp} ${String(Math.round(webp.length / 1024))} KB`);
      await context.close();
    }
  } else {
    const out = join(root, '..', '..', '.rounds', `templates-core-round-${round}`, 'finance-app');
    mkdirSync(out, { recursive: true });
    const shots = roundShots();
    const failed: string[] = [];
    await runAll(shots, 4, async (shot) => {
      const { context, page } = await open(browser, base, shot);
      try {
        writeFileSync(join(out, shot.file), await capture(page, shot));
      } catch (error) {
        failed.push(
          `${shot.file}: ${error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error)}`,
        );
      } finally {
        await context.close();
      }
    });
    console.log(
      `${String(shots.length - failed.length)} of ${String(shots.length)} shots in ${out}`,
    );
    for (const line of failed) console.log(`failed ${line}`);
  }
} finally {
  await browser.close();
  server.close();
}
