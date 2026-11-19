/**
 * Headless screenshots of the playground for a design round: `pnpm shoot <round>`.
 * Writes to .rounds/round-<n>/ at the repo root (gitignored). Starts its own Vite server, never
 * touches the screen, and prints browser checks (tabular figures, dialog focus trap, sort
 * announcement, calendar focus, reduced motion, phone overflow).
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
  // Views load lazily: wait for the view itself, not just the empty root.
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
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
  const dialog = page.getByRole('dialog', { name: 'Add expense' });
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

      // Table: sort by amount from the keyboard, select two rows, open the period picker.
      await app.getByRole('button', { name: /^Amount/ }).focus();
      await app.keyboard.press('Enter');
      await settle(app);
      if (theme === 'default' && mode === 'light')
        console.log('sort announcement', await app.getByRole('status').first().textContent());
      await app.getByRole('checkbox', { name: /^Select Linear/ }).click();
      await app.getByRole('checkbox', { name: /^Select Hotel Bristol, 4 Mar/ }).click();
      await settle(app);
      await app.screenshot({ path: join(out, `table-selected-${name}.png`) });
      // Remove the two, then take them back with the toast's Undo.
      await app.getByRole('button', { name: 'Remove' }).click();
      await app.getByText('2 expenses removed').waitFor();
      await settle(app);
      await app.screenshot({ path: join(out, `removed-${name}.png`) });
      await app.getByRole('button', { name: 'Undo' }).click();
      await app.getByText('2 expenses removed').waitFor({ state: 'detached' });
      await app.getByRole('checkbox', { name: /^Select Linear/ }).click();
      await app.getByRole('checkbox', { name: /^Select Hotel Bristol, 4 Mar/ }).click();
      await app.getByRole('checkbox', { name: 'Select all expenses' }).click();
      await app.getByRole('checkbox', { name: 'Select all expenses' }).click();
      await app.getByRole('button', { name: /^Period/ }).click();
      await app.getByRole('grid').first().waitFor();
      await settle(app);
      await app.screenshot({ path: join(out, `period-${name}.png`) });
      await app.keyboard.press('Escape');
      await app.getByRole('grid').first().waitFor({ state: 'detached' });

      await app.getByRole('button', { name: 'Add expense' }).click();
      await app.getByRole('dialog', { name: 'Add expense' }).waitFor();
      await settle(app);
      await app.screenshot({ path: join(out, `dialog-${name}.png`) });
      if (theme === 'default' && mode === 'light')
        console.log('focus trap', await focusTrapCheck(app));

      // Date field: open the calendar from its button; focus lands on the chosen day.
      await app.getByRole('button', { name: /^Choose date/ }).click();
      await app.getByRole('grid').waitFor();
      await settle(app);
      await app.screenshot({ path: join(out, `datepicker-${name}.png`) });
      if (theme === 'default' && mode === 'light')
        console.log(
          'calendar focus',
          await app.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        );
      // Over and back from the keyboard, so the picked date stays the 19th in every shot.
      await app.keyboard.press('ArrowRight');
      await app.keyboard.press('ArrowLeft');
      await app.keyboard.press('Enter');
      await app.getByRole('grid').waitFor({ state: 'detached' });

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
      await app.getByRole('dialog', { name: 'Add expense' }).waitFor({ state: 'detached' });
      await app.getByText('Expense added').waitFor();
      await settle(app);
      await app.screenshot({ path: join(out, `saved-${name}.png`) });
      await app.close();
    }
  }
  // Reduced motion: popups and toasts keep their fade but do not travel.
  const calm = await browser.newPage({
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await calm.goto(`${base}?view=app`);
  await settle(calm);
  console.log(
    'reduced motion shift',
    await calm.evaluate(() =>
      getComputedStyle(document.querySelector('[data-theme]') ?? document.body).getPropertyValue(
        '--rx-motion-distance-shift',
      ),
    ),
  );
  await calm.close();

  // Phone width: no sideways scroll, and the dialog still fits.
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    // A touch screen, so coarse pointer sizes (44px days and checkbox areas) apply.
    isMobile: true,
    hasTouch: true,
  });
  await phone.goto(`${base}?view=app&theme=ledger&mode=dark`);
  await settle(phone);
  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  console.log('phone horizontal overflow px', overflow);
  await phone.screenshot({ path: join(out, 'phone-app.png'), fullPage: true });
  await phone.getByRole('checkbox', { name: /^Select Linear/ }).tap();
  await phone.getByRole('checkbox', { name: /^Select Figma/ }).tap();
  await settle(phone);
  await phone.screenshot({ path: join(out, 'phone-selected.png') });
  await phone.getByRole('checkbox', { name: 'Select all expenses' }).tap();
  await phone.getByRole('checkbox', { name: 'Select all expenses' }).tap();
  await phone.getByRole('button', { name: 'Add expense' }).click();
  await phone.getByRole('dialog', { name: 'Add expense' }).waitFor();
  await settle(phone);
  await phone.screenshot({ path: join(out, 'phone-dialog.png') });
  await phone.getByRole('button', { name: /^Choose date/ }).click();
  await phone.getByRole('grid').waitFor();
  await settle(phone);
  await phone.screenshot({ path: join(out, 'phone-datepicker.png') });
  await phone.close();

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
