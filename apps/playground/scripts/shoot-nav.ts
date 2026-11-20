/**
 * Headless screenshots of the navigation and overlay components and the app shell, for a design
 * round: `pnpm shoot:nav <round> [filter]`. Writes to .rounds/round-<n>/nav/ at the repo root
 * (gitignored). Starts its own Vite server, never touches the screen, and prints browser checks
 * (phone overflow, smallest touch target, landmarks, focus after closing).
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
const only = process.argv[3];
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'nav');
mkdirSync(out, { recursive: true });

const MODES = ['light', 'dark'] as const;
const wanted = (name: string) => only === undefined || name.includes(only);

async function settle(page: Page) {
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

interface Options {
  phone?: boolean;
  full?: boolean;
  reducedMotion?: boolean;
}

async function open(browser: Browser, base: string, query: string, options: Options = {}) {
  const phone = options.phone === true;
  const page = await browser.newPage({
    viewport: { width: phone ? 390 : 1440, height: phone ? 844 : 900 },
    deviceScaleFactor: phone ? 2 : 1,
    ...(phone ? { isMobile: true, hasTouch: true } : {}),
    ...(options.reducedMotion === true ? { reducedMotion: 'reduce' as const } : {}),
  });
  await page.goto(`${base}?${query}`);
  await settle(page);
  return page;
}

async function snap(page: Page, name: string, full = false) {
  await settle(page);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: full });
}

/** The smallest visible interactive target on a phone, by its box. */
async function smallestTarget(page: Page) {
  return page.evaluate(() => {
    let smallest = { size: Infinity, name: '' };
    const selector =
      'button, a[href], [role="tab"], [role="menuitem"], [role="option"], input, [role="combobox"]';
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (element.closest('[hidden], [aria-hidden="true"], .sr-only, p') !== null) continue;
      if (element.classList.contains('sr-only') || getComputedStyle(element).opacity === '0')
        continue;
      if (box.bottom < 0 || box.top > window.innerHeight) continue;
      // A control may extend its hit area past its box with an absolute ::after.
      const after = getComputedStyle(element, '::after');
      const hit =
        after.position === 'absolute' && after.content !== 'none'
          ? Math.min(Number.parseFloat(after.width), Number.parseFloat(after.height))
          : 0;
      const size = Math.max(Math.min(box.width, box.height), Number.isFinite(hit) ? hit : 0);
      if (size < smallest.size)
        smallest = {
          size,
          name: `${element.tagName.toLowerCase()} "${(element.getAttribute('aria-label') ?? element.textContent).trim().slice(0, 30)}"`,
        };
    }
    return `${smallest.size.toFixed(0)}px ${smallest.name}`;
  });
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

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
  // At rest: the shell and the gallery, every mode, desktop and phone.
  for (const mode of MODES) {
    const q = `mode=${mode}`;
    for (const phone of [false, true]) {
      const device = phone ? 'phone' : 'desktop';
      if (wanted(`shell-${mode}-${device}`)) {
        const page = await open(browser, base, `view=shell&${q}`, { phone });
        await snap(page, `shell-${mode}-${device}`);
        if (phone) {
          console.log(`shell ${mode} phone overflow px`, await overflow(page));
          console.log(`shell ${mode} phone smallest target`, await smallestTarget(page));
        }
        await page.close();
      }
      if (wanted(`nav-${mode}-${device}`)) {
        const page = await open(browser, base, `view=nav&${q}`, { phone });
        await snap(page, `nav-${mode}-${device}`, true);
        if (phone) {
          console.log(`nav ${mode} phone overflow px`, await overflow(page));
          console.log(`nav ${mode} phone smallest target`, await smallestTarget(page));
        }
        await page.close();
      }
    }
  }

  // Open states, in light and dark.
  for (const mode of MODES) {
    const q = `mode=${mode}`;
    const tag = mode;

    if (wanted(`open-command-${tag}`)) {
      const page = await open(browser, base, `view=shell&${q}`);
      await page.keyboard.press('ControlOrMeta+k');
      await page.getByRole('combobox', { name: 'Command menu' }).waitFor();
      await snap(page, `open-command-${tag}`);
      await page.keyboard.type('inv');
      await snap(page, `open-command-filtered-${tag}`);
      await page.keyboard.type('zzz');
      await snap(page, `open-command-empty-${tag}`);
      await page.keyboard.press('Escape');
      await settle(page);
      console.log(
        `command menu ${tag}: focus after Escape on`,
        await page.evaluate(() => document.activeElement?.tagName ?? 'none'),
      );
      await page.close();
    }

    if (wanted(`open-account-${tag}`)) {
      const page = await open(browser, base, `view=shell&${q}`);
      await page.getByRole('button', { name: /Account/ }).click();
      await page.getByRole('menu').waitFor();
      await page.keyboard.press('ArrowDown');
      await snap(page, `open-account-${tag}`);
      await page.close();
    }

    if (wanted(`open-notifications-${tag}`)) {
      const page = await open(browser, base, `view=shell&${q}`);
      await page.getByRole('button', { name: /Notifications/ }).click();
      await snap(page, `open-notifications-${tag}`);
      await page.close();
    }

    if (wanted(`rail-${tag}`)) {
      const page = await open(browser, base, `view=shell&${q}&collapsed=1`);
      await snap(page, `rail-${tag}`);
      await page.getByRole('link', { name: /Payables/ }).hover();
      await page.locator('[data-slot="tooltip"]').waitFor();
      await snap(page, `rail-tooltip-${tag}`);
      await page.getByRole('button', { name: 'Receivables' }).click();
      await page.getByRole('menu').waitFor();
      await snap(page, `rail-flyout-${tag}`);
      await page.close();
    }

    if (wanted(`phone-sheet-${tag}`)) {
      const page = await open(browser, base, `view=shell&${q}`, { phone: true });
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('dialog').waitFor();
      await snap(page, `phone-sheet-${tag}`);
      await page.close();
    }

    if (wanted(`open-menu-${tag}`)) {
      const page = await open(browser, base, `view=nav&${q}`);
      await page.getByRole('button', { name: 'Actions', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Export' }).hover();
      await page.keyboard.press('ArrowRight');
      await page.getByRole('menuitem', { name: 'CSV' }).waitFor();
      await page.keyboard.press('ArrowDown');
      await snap(page, `open-menu-${tag}`);
      await page.close();
    }

    if (wanted(`open-context-${tag}`)) {
      const page = await open(browser, base, `view=nav&${q}`);
      await page.getByText('Right-click or long-press').click({ button: 'right' });
      await page.getByRole('menu').waitFor();
      await snap(page, `open-context-${tag}`);
      await page.close();
    }

    if (wanted(`open-overlays-${tag}`)) {
      const page = await open(browser, base, `view=nav&${q}`);
      await page.getByRole('button', { name: 'Filters' }).click();
      await page.getByRole('dialog').waitFor();
      await page.getByRole('dialog').evaluate((node) => {
        node.scrollIntoView({ block: 'center' });
      });
      await snap(page, `open-popover-${tag}`);
      await page.keyboard.press('Escape');
      await page.getByRole('link', { name: 'Barrett Furniture Ltd' }).hover();
      await page.waitForTimeout(700);
      await snap(page, `open-hover-card-${tag}`);
      await page.getByRole('button', { name: 'Duplicate' }).first().hover();
      await page.locator('[data-slot="tooltip"]').waitFor();
      await snap(page, `open-tooltip-${tag}`);
      await page.close();
    }

    if (wanted(`open-navmenu-${tag}`)) {
      const page = await open(browser, base, `view=nav&${q}`);
      await page.getByRole('button', { name: 'Product' }).click();
      await page.getByRole('link', { name: /Accounting/ }).waitFor();
      await snap(page, `open-navmenu-${tag}`);
      await page.close();
    }

    if (wanted(`open-breadcrumb-${tag}`)) {
      const page = await open(browser, base, `view=nav&${q}`);
      await page.getByRole('button', { name: 'Show hidden levels' }).click();
      await page.getByRole('menu').waitFor();
      await snap(page, `open-breadcrumb-${tag}`);
      await page.close();
    }

    if (wanted(`open-sheet-${tag}`)) {
      const page = await open(browser, base, `view=nav&${q}`);
      await page.getByRole('button', { name: 'Right', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await snap(page, `open-sheet-${tag}`);
      await page.close();
      const phone = await open(browser, base, `view=nav&${q}`, { phone: true });
      await phone.getByRole('button', { name: 'Bottom sheet' }).click();
      await phone.getByRole('dialog').waitFor();
      await snap(phone, `open-bottom-sheet-phone-${tag}`);
      // The layout viewport widens on a phone when anything overflows, and a sheet sized to it is
      // then cut off at the edge: compare it with the screen once the sheet is open.
      const widened = await phone.evaluate(
        () => window.innerWidth - document.documentElement.clientWidth,
      );
      console.info(`bottom sheet ${tag} viewport widened by px ${String(widened)}`);
      await phone.close();
    }
  }

  // The motion add-on and reduced motion, at rest and with the menu open.
  if (wanted('motion')) {
    const page = await open(browser, base, 'view=nav&motion=on');
    await page.getByRole('button', { name: 'Actions', exact: true }).click();
    await page.getByRole('menu').waitFor();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await snap(page, 'motion-menu-highlight');
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: /Overdue/ }).click();
    for (const ms of [40, 120, 400]) {
      await page.waitForTimeout(ms === 40 ? 40 : ms - (ms === 120 ? 40 : 120));
      await page.screenshot({ path: join(out, `motion-tabs-${String(ms)}ms.png`) });
    }
    await page.close();
    const calm = await open(browser, base, 'view=nav&motion=on', { reducedMotion: true });
    console.log(
      'reduced motion: motioned elements',
      await calm.evaluate(() => document.querySelectorAll('[data-motion]').length),
    );
    await calm.close();
  }

  // Landmarks and the skip link.
  if (wanted('a11y')) {
    const page = await open(browser, base, 'view=shell');
    await page.keyboard.press('Tab');
    console.log(
      'first Tab stop',
      await page.evaluate(() => document.activeElement?.textContent.trim() ?? 'none'),
    );
    await snap(page, 'a11y-skip-link');
    console.log(
      'landmarks',
      await page.evaluate(() =>
        [...document.querySelectorAll('nav, main, header, aside')]
          .map(
            (n) =>
              `${n.tagName.toLowerCase()}${n.getAttribute('aria-label') === null ? '' : `[${n.getAttribute('aria-label') ?? ''}]`}`,
          )
          .join(' '),
      ),
    );
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
