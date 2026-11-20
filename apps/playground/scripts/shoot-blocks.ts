/**
 * Headless screenshots of the pro blocks for a design round: `pnpm shoot:blocks <round>`.
 * Writes to .rounds/round-<n>/blocks/ at the repo root (gitignored). Starts its own Vite server and
 * never touches the screen. Shots: the dashboard in every theme and mode, each block alone in every
 * theme, mode and compact density, phone width, reduced motion and the motion
 * variant's entrance, plus browser checks (overflow, touch targets, chart keyboard tooltips).
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
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'blocks');
mkdirSync(out, { recursive: true });

const THEMES = ['default', 'ledger'] as const;
const MODES = ['light', 'dark'] as const;
const BLOCKS = [
  'kpi-row',
  'cash-flow',
  'invoice-list',
  'invoice-detail',
  'ledger',
  'expense-approval',
  'ar-aging',
  'budget-vs-actual',
  'profit-and-loss',
  'tax-summary',
  'cash-runway',
  'bank-reconciliation',
  'payouts',
  'vendors-list',
] as const;

/** The SaaS blocks, shot as `saas-<block>-...`; `shoot:blocks <n> saas` takes only these. */
const SAAS_BLOCKS = [
  'sign-in',
  'sign-up',
  'two-factor',
  'reset-password',
  'profile-settings',
  'team-members',
  'billing',
  'api-keys',
  'notification-preferences',
  'pricing-table',
  'onboarding-checklist',
  'activity-feed',
  'notifications-center',
  'changelog',
  'users-table',
  'kanban-board',
  'comment-thread',
  'file-manager',
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

/** Scroll the whole page through once, so first-view entrances run before a full-page shot. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await settle(page);
}

async function shoot(
  browser: Browser,
  base: string,
  name: string,
  query: string,
  options: { width?: number; phone?: boolean; reducedMotion?: boolean } = {},
) {
  if (!wanted(name)) return null;
  const page = await browser.newPage({
    viewport: { width: options.width ?? 1440, height: options.phone === true ? 844 : 900 },
    deviceScaleFactor: options.phone === true ? 2 : 1,
    ...(options.phone === true ? { isMobile: true, hasTouch: true } : {}),
    ...(options.reducedMotion === true ? { reducedMotion: 'reduce' as const } : {}),
  });
  await page.goto(`${base}?view=blocks&${query}`);
  await settle(page);
  await scrollThrough(page);
  // A viewport as tall as the page, not `fullPage`, so touch sizes stay in the picture.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: options.width ?? 1440, height });
  await settle(page);
  await page.screenshot({ path: join(out, `${name}.png`) });
  return page;
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
  for (const theme of THEMES) {
    for (const mode of MODES) {
      const page = await shoot(
        browser,
        base,
        `dashboard-${theme}-${mode}`,
        `theme=${theme}&mode=${mode}`,
      );
      await page?.close();
    }
  }
  for (const block of BLOCKS) {
    for (const theme of THEMES) {
      for (const mode of MODES) {
        const page = await shoot(
          browser,
          base,
          `${block}-${theme}-${mode}`,
          `block=${block}&theme=${theme}&mode=${mode}`,
          { width: 1180 },
        );
        await page?.close();
      }
    }
  }

  for (const block of [
    'invoice-list',
    'ledger',
    'cash-flow',
    'expense-approval',
    'ar-aging',
    'budget-vs-actual',
    'profit-and-loss',
    'tax-summary',
    'cash-runway',
    'bank-reconciliation',
    'payouts',
    'vendors-list',
  ]) {
    const page = await shoot(browser, base, `empty-${block}`, `block=${block}&empty=1`, {
      width: 1180,
    });
    await page?.close();
  }

  for (const block of SAAS_BLOCKS) {
    for (const theme of THEMES) {
      for (const mode of MODES) {
        const page = await shoot(
          browser,
          base,
          `saas-${block}-${theme}-${mode}`,
          `block=${block}&theme=${theme}&mode=${mode}`,
          { width: 1180 },
        );
        await page?.close();
      }
    }
    const empty = await shoot(browser, base, `saas-${block}-empty`, `block=${block}&empty=1`, {
      width: 1180,
    });
    await empty?.close();
    const phone = await shoot(
      browser,
      base,
      `saas-${block}-phone-ledger-dark`,
      `block=${block}&theme=ledger&mode=dark`,
      { width: 390, phone: true },
    );
    if (phone !== null) {
      await phone.setViewportSize({ width: 390, height: 844 });
      const overflow = await phone.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      const target = await smallestTouchTarget(phone);
      console.log(`saas ${block}: phone overflow ${String(overflow)}px, smallest target`, target);
      await phone.close();
    }
  }
  for (const theme of THEMES) {
    for (const mode of MODES) {
      const page = await shoot(
        browser,
        base,
        `saas-all-${theme}-${mode}`,
        `set=saas&theme=${theme}&mode=${mode}`,
      );
      await page?.close();
    }
  }

  const compact = await shoot(browser, base, 'dashboard-compact', 'density=compact');
  await compact?.close();
  const calm = await shoot(browser, base, 'dashboard-reduced-motion', 'motion=on', {
    reducedMotion: true,
  });
  await calm?.close();

  const phone = await shoot(browser, base, 'phone-dashboard', 'theme=ledger&mode=dark', {
    width: 390,
    phone: true,
  });
  if (phone !== null) {
    await phone.setViewportSize({ width: 390, height: 844 });
    console.log(
      'phone horizontal overflow px',
      await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    );
    console.log('phone smallest touch target', await smallestTouchTarget(phone));
    await phone.close();
  }
  // The filter tabs of every segmented control must stay on one row at phone width.
  for (const block of [
    'invoice-list',
    'expense-approval',
    'profit-and-loss',
    'tax-summary',
    'cash-runway',
    'bank-reconciliation',
    'payouts',
    'vendors-list',
  ]) {
    const page = await shoot(browser, base, `phone-${block}`, `block=${block}`, {
      width: 390,
      phone: true,
    });
    if (page === null) continue;
    console.log(
      `phone ${block} segmented rows`,
      await page.evaluate(() =>
        [...document.querySelectorAll('[data-slot="segmented"]')]
          .map(
            (group) => new Set([...group.children].map((c) => c.getBoundingClientRect().top)).size,
          )
          .join(', '),
      ),
    );
    console.log(
      `phone ${block} table past its block px`,
      await page.evaluate(() =>
        Math.max(
          0,
          ...[...document.querySelectorAll('[data-slot="block"] table')].map((table) => {
            const block = table.closest('[data-slot="block"]')?.getBoundingClientRect();
            return block === undefined ? 0 : table.getBoundingClientRect().right - block.right;
          }),
        ),
      ),
    );
    console.log(
      `phone ${block} horizontal overflow px`,
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    );
    console.log(`phone ${block} smallest touch target`, await smallestTouchTarget(page));
    const filters = page.locator('[data-slot="segmented"]').first();
    if ((await filters.count()) > 0) {
      await filters.locator('..').screenshot({ path: join(out, `phone-${block}-filters.png`) });
    }
    await page.close();
  }
  const phoneLight = await shoot(browser, base, 'phone-dashboard-default', '', {
    width: 390,
    phone: true,
  });
  await phoneLight?.close();

  // Keyboard: tab to the cash flow plot and step with the arrow keys; the tooltip follows.
  if (wanted('keyboard')) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${base}?view=blocks&block=cash-flow`);
    await settle(page);
    await page.locator('.recharts-surface').first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await settle(page);
    await page.screenshot({ path: join(out, 'keyboard-cash-flow-tooltip.png') });
    console.log(
      'chart keyboard tooltip',
      (await page.locator('.recharts-tooltip-wrapper').first().innerText()).replace(/\s+/g, ' '),
    );
    await page.close();
  }

  // The motion variant's first view, frame by frame: entrances play once.
  if (wanted('motion')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}?view=blocks&motion=on`);
    await page.waitForFunction(() => document.querySelector('[data-slot="block"]') !== null);
    await page.evaluate(() => document.fonts.ready);
    for (const [index, ms] of [0, 80, 160, 260, 420].entries()) {
      await page.waitForTimeout(index === 0 ? 0 : ms - ([0, 80, 160, 260, 420][index - 1] ?? 0));
      await page.screenshot({
        path: join(out, `motion-enter-${String(index)}-${String(ms)}ms.png`),
      });
    }
    await page.close();
  }

  console.log(`screenshots in ${out}`);
} finally {
  await browser.close();
  await server.close();
}
