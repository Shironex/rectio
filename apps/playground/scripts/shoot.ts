/**
 * Headless screenshots of the playground for a design round: `pnpm shoot <round>`.
 * Writes to .rounds/round-<n>/ at the repo root (gitignored). Starts its own Vite server, never
 * touches the screen, and prints browser checks (tabular figures, dialog focus trap).
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Page } from 'playwright';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`);
mkdirSync(out, { recursive: true });

const THEMES = ['default', 'ledger'] as const;
const MODES = ['light', 'dark'] as const;

/** Wait until no CSS transition or animation is running, so shots never catch a half state. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Spinners loop forever; only finite transitions have to finish.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
}

async function tabularCheck(page: Page) {
  return page.evaluate(() => {
    const result: Record<string, string> = {};
    for (const scope of document.querySelectorAll<HTMLElement>('[data-panel]')) {
      const probe = document.createElement('span');
      probe.style.fontFamily = 'var(--rx-font-family-numeric)';
      probe.style.fontVariantNumeric = 'tabular-nums lining-nums';
      probe.style.position = 'absolute';
      probe.style.whiteSpace = 'pre';
      scope.append(probe);
      probe.textContent = '1111111111';
      const ones = probe.getBoundingClientRect().width;
      probe.textContent = '0000000000';
      const zeros = probe.getBoundingClientRect().width;
      const family = getComputedStyle(probe).fontFamily.split(',')[0] ?? '';
      probe.remove();
      result[scope.dataset.panel ?? '?'] =
        `${family}: ${Math.abs(ones - zeros) < 0.5 ? 'tabular' : 'PROPORTIONAL'} (${ones.toFixed(1)} vs ${zeros.toFixed(1)})`;
    }
    return result;
  });
}

async function focusTrapCheck(page: Page) {
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    // Base UI wraps focus through guard elements; let the redirect land before sampling.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    const inside = await dialog.evaluate((node) => node.contains(document.activeElement));
    if (!inside) return `escaped after ${String(i + 1)} tabs`;
  }
  return 'held for 8 tabs';
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
  const page = await browser.newPage({
    viewport: { width: 1680, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto(base);
  await settle(page);
  await page.screenshot({ path: join(out, 'matrix.png'), fullPage: true });
  console.log('tabular figures', await tabularCheck(page));

  for (const theme of THEMES) {
    for (const mode of MODES) {
      const name = `${theme}-${mode}`;
      const app = await browser.newPage({
        viewport: { width: 1280, height: 860 },
        deviceScaleFactor: 2,
      });
      await app.goto(`${base}?view=app&theme=${theme}&mode=${mode}`);
      await settle(app);
      await app.screenshot({ path: join(out, `app-${name}.png`) });

      await app.getByRole('button', { name: 'Add expense' }).click();
      await app.getByRole('dialog').waitFor();
      await settle(app);
      await app.screenshot({ path: join(out, `dialog-${name}.png`) });
      if (theme === 'default' && mode === 'light')
        console.log('focus trap', await focusTrapCheck(app));

      await app.getByRole('button', { name: 'Save expense' }).click();
      await settle(app);
      await app.screenshot({ path: join(out, `dialog-errors-${name}.png`) });

      await app.getByRole('textbox', { name: 'Merchant' }).fill('Deutsche Bahn');
      await app.getByRole('textbox', { name: 'Amount, EUR' }).fill('129.40');
      await app.getByRole('combobox', { name: 'Category' }).click();
      await app.getByRole('listbox').waitFor();
      await app.keyboard.press('ArrowDown');
      await settle(app);
      await app.screenshot({ path: join(out, `select-${name}.png`) });

      await app.keyboard.press('Escape');
      await app.getByRole('listbox').waitFor({ state: 'detached' });
      await app.getByRole('textbox', { name: 'Merchant' }).focus();
      await app.keyboard.press('Shift+Tab');
      await app.keyboard.press('Tab');
      await settle(app);
      await app.screenshot({ path: join(out, `focus-${name}.png`) });

      // Finish the form from the keyboard and save: the row and the status line appear.
      await app.getByRole('combobox', { name: 'Category' }).click();
      await app.getByRole('option', { name: 'Rail' }).click();
      await app.getByRole('textbox', { name: 'Merchant' }).press('ControlOrMeta+Enter');
      await app.getByRole('dialog').waitFor({ state: 'detached' });
      await settle(app);
      await app.screenshot({ path: join(out, `saved-${name}.png`) });
      await app.close();
    }
  }
  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
