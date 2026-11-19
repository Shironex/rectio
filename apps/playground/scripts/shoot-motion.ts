/**
 * Headless captures of the motion add-on for a design round: `pnpm shoot:motion <round>`.
 * Writes to .rounds/round-<n>/motion/ (gitignored): stills, one contact sheet of frames per
 * interaction (plain beside motioned), and a video of the whole run. Starts its own Vite server
 * and never touches the screen.
 *
 * Animations are slowed to a tenth through the DevTools protocol, so frames taken every few
 * hundred milliseconds of real time land a few tens of milliseconds apart in animation time.
 */
import { mkdirSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Locator, type Page } from 'playwright';
import { createServer } from 'vite';

import { dialogFieldsVerdict, watchDialogFields } from './checks.ts';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'motion');
mkdirSync(join(out, 'frames'), { recursive: true });

/** Animation time runs at this fraction of real time while frames are taken. */
const RATE = 0.1;
/** Frames per interaction and the real-time gap between them. */
const FRAMES = 12;
const GAP_MS = 320;

const server = await createServer({
  root: join(here, '..'),
  server: { port: 0, strictPort: false },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
}

async function slowDown(page: Page, rate: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: rate });
  return cdp;
}

/**
 * Runs an action, then takes frames of a region (a locator, grown downward by `below` pixels for a
 * popup that opens under it) or of the whole viewport. Returns the frame file names.
 */
async function filmstrip(
  page: Page,
  name: string,
  region: Locator | 'viewport',
  action: () => Promise<void>,
  below = 0,
  gap = GAP_MS,
) {
  let clip: { x: number; y: number; width: number; height: number } | undefined;
  if (region !== 'viewport') {
    await region.scrollIntoViewIfNeeded();
    const box = await region.boundingBox();
    if (box === null) throw new Error(`${name}: region not visible`);
    clip = {
      x: Math.max(0, box.x - 16),
      y: Math.max(0, box.y - 16),
      width: box.width + 32,
      height: box.height + 32 + below,
    };
  }
  const files: string[] = [];
  await action();
  for (let i = 0; i < FRAMES; i += 1) {
    const file = join(out, 'frames', `${name}-${String(i).padStart(2, '0')}.png`);
    await page.screenshot(clip === undefined ? { path: file } : { path: file, clip });
    files.push(file);
    await page.waitForTimeout(gap);
  }
  gaps.set(files[0] ?? '', gap);
  return files;
}

/** The real-time gap each strip was taken with, keyed by its first frame. */
const gaps = new Map<string, number>();

/** One sheet per interaction: the plain strip above the motioned one, frames left to right. */
async function contactSheet(page: Page, name: string, rows: { label: string; files: string[] }[]) {
  const html = `<!doctype html><body style="margin:0;padding:16px;background:#fff;font:12px system-ui">
    ${rows
      .map(
        (row) => `<div style="margin-bottom:12px"><div style="margin-bottom:4px">${row.label}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${row.files
        .map(
          (f, i) =>
            `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(f).toString('base64')}" style="width:100%;display:block;border:1px solid #ddd"><figcaption>${String(Math.round(i * (gaps.get(row.files[0] ?? '') ?? GAP_MS) * RATE))} ms</figcaption></figure>`,
        )
        .join('')}</div></div>`,
      )
      .join('')}</body>`;
  await page.setViewportSize({ width: 1900, height: 600 });
  await page.setContent(html);
  await page.waitForLoadState('load');
  await page.screenshot({ path: join(out, `sheet-${name}.png`), fullPage: true });
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
    recordVideo: { dir: out, size: { width: 1440, height: 1100 } },
  });
  const page = await context.newPage();
  await page.goto(`${base}?view=motion&theme=default&mode=light`);
  await settle(page);
  await page.screenshot({ path: join(out, 'page-default-light.png'), fullPage: true });

  const cdp = await slowDown(page, RATE);
  const column = (which: 'plain' | 'motion') => page.locator(`[data-column="${which}"]`);
  const section = (which: 'plain' | 'motion', title: string) =>
    column(which)
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: title }) });

  const strips: Record<string, { label: string; files: string[] }[]> = {};
  const record = async (name: string, run: (which: 'plain' | 'motion') => Promise<string[]>) => {
    strips[name] = [];
    for (const which of ['plain', 'motion'] as const) {
      strips[name].push({ label: which, files: await run(which) });
      // Close whatever the strip left open (a list, a dialog) before the next one.
      await page.keyboard.press('Escape');
      await page.mouse.move(0, 0);
      await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
      await settle(page);
      await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
    }
  };

  await record('button-loading', (which) => {
    const s = section(which, 'Button');
    return filmstrip(page, `button-${which}`, s, () =>
      s.getByRole('button', { name: 'Save expense' }).click(),
    );
  });

  await record('amount-step', (which) => {
    // Tight on the field: the nudge is a hair, so the strip shows the figures large.
    const s = section(which, 'Amount input');
    return filmstrip(page, `amount-${which}`, s.getByRole('textbox'), () =>
      s.getByRole('button', { name: 'Add 10.00' }).click(),
    );
  });

  await record('select-open', (which) => {
    const s = section(which, 'Select');
    return filmstrip(
      page,
      `select-open-${which}`,
      s,
      async () => {
        await s.getByRole('combobox', { name: 'Category' }).click();
      },
      260,
    );
  });
  await record('select-glide', async (which) => {
    const s = section(which, 'Select');
    await s.getByRole('combobox', { name: 'Category' }).click();
    await page.getByRole('listbox').waitFor();
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await settle(page);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
    const files = await filmstrip(
      page,
      `select-glide-${which}`,
      s,
      async () => {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
      },
      260,
    );
    await page.keyboard.press('Escape');
    return files;
  });

  await record('dialog-open', (which) => {
    const s = section(which, 'Dialog');
    return filmstrip(page, `dialog-open-${which}`, 'viewport', () =>
      s.getByRole('button', { name: 'Submit for approval' }).click(),
    );
  });
  await record('dialog-close', async (which) => {
    const s = section(which, 'Dialog');
    await s.getByRole('button', { name: 'Submit for approval' }).click();
    await page.getByRole('dialog').waitFor();
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await settle(page);
    await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
    return filmstrip(page, `dialog-close-${which}`, 'viewport', () =>
      page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click(),
    );
  });

  await record('row-add', (which) => {
    const s = section(which, 'Rows and total');
    return filmstrip(
      page,
      `row-add-${which}`,
      s,
      () => s.getByRole('button', { name: /^Add / }).click(),
      0,
      GAP_MS * 2,
    );
  });
  await record('row-remove', (which) => {
    const s = section(which, 'Rows and total');
    return filmstrip(
      page,
      `row-remove-${which}`,
      s,
      () => s.getByRole('button', { name: 'Remove Deutsche Bahn' }).click(),
      0,
      GAP_MS * 2,
    );
  });

  // The expense report with motion on, ledger dark: add an expense through the dialog.
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.goto(`${base}?view=app&motion=on&theme=ledger&mode=dark`);
  await settle(page);
  await page.screenshot({ path: join(out, 'report-ledger-dark.png') });
  await page.getByRole('button', { name: 'Add expense' }).click();
  await page.getByRole('dialog').waitFor();
  await settle(page);
  await page.screenshot({ path: join(out, 'report-dialog-ledger-dark.png') });
  await page.getByRole('textbox', { name: 'Merchant' }).fill('Deutsche Bahn');
  await page.getByRole('textbox', { name: 'Amount, EUR' }).fill('129.40');
  await page.getByRole('combobox', { name: 'Category' }).click();
  await page.getByRole('option', { name: 'Rail' }).click();
  await settle(page);
  await watchDialogFields(page);
  const slow = await slowDown(page, RATE);
  const reportFiles = await filmstrip(
    page,
    'report-save',
    'viewport',
    () => page.getByRole('button', { name: 'Save expense' }).click(),
    0,
    GAP_MS * 3,
  );
  await slow.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  console.log('motion dialog on save', await dialogFieldsVerdict(page));
  await settle(page);
  await page.screenshot({ path: join(out, 'report-saved-ledger-dark.png') });

  // Two more toasts in quick succession: each arrives calmly and the stack glides up.
  const remove = async (merchant: RegExp) => {
    await page.getByRole('checkbox', { name: merchant }).click();
    await page.getByRole('button', { name: 'Remove' }).click();
  };
  await slow.send('Animation.setPlaybackRate', { playbackRate: RATE });
  const toastFiles = await filmstrip(
    page,
    'toast-stack',
    'viewport',
    async () => {
      await remove(/^Select Figma/);
      await page.waitForTimeout(GAP_MS * 2);
      await remove(/^Select Linear/);
    },
    0,
    GAP_MS * 2,
  );
  await slow.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await settle(page);
  // The strip outlives the toasts' timer: remove two more rows for a still of a settled stack.
  await remove(/^Select Lufthansa/);
  await remove(/^Select Atelier/);
  await settle(page);
  await page.screenshot({ path: join(out, 'report-toasts-ledger-dark.png') });
  await page.close();
  await context.close();

  // Name the video after the run instead of Playwright's random id.
  for (const file of readdirSync(out).filter((f) => f.endsWith('.webm') && f !== 'run.webm')) {
    renameSync(join(out, file), join(out, 'run.webm'));
  }

  const sheets = await browser.newPage();
  for (const [name, rows] of Object.entries(strips)) await contactSheet(sheets, name, rows);
  await contactSheet(sheets, 'report-save', [{ label: 'motion, ledger dark', files: reportFiles }]);
  await contactSheet(sheets, 'toast-stack', [{ label: 'motion, ledger dark', files: toastFiles }]);
  console.log(`motion captures in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
