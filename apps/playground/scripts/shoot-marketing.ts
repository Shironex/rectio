/**
 * Headless screenshots of the marketing blocks for a design round: `pnpm shoot:marketing <round>`.
 * Writes to .rounds/round-<n>/marketing/ at the repo root (gitignored). Starts its own Vite server
 * and never touches the screen. Shots: the landing template in every theme and mode at desktop and
 * phone width, each block's variants, the motion variant's entrance and reduced motion, plus
 * browser checks (horizontal overflow, the smallest touch target among links and buttons).
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
/** Optional second argument: only shots whose file name contains it, for a quick look. */
const only = process.argv[3];
const out = join(here, '..', '..', '..', '.rounds', `round-${round}`, 'marketing');
mkdirSync(out, { recursive: true });

const THEMES = ['default', 'ledger'] as const;
const MODES = ['light', 'dark'] as const;
const BLOCKS = [
  'announcement-bar',
  'site-header',
  'hero',
  'logo-strip',
  'feature-grid',
  'stat-row',
  'testimonials',
  'faq',
  'cta-band',
  'newsletter',
  'team',
  'contact',
  'blog',
  'site-footer',
  'legal',
  'cookie-consent',
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
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await settle(page);
}

/** The smallest touch target among links, buttons and fields: box or `::after` hit area. */
async function smallestTarget(page: Page) {
  return page.evaluate(() => {
    let smallest = { size: Infinity, name: '' };
    for (const element of document.querySelectorAll<HTMLElement>(
      'a[href], button, input, [role="switch"], summary',
    )) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || element.closest('[aria-hidden="true"], [inert]') !== null) continue;
      // Links inside running text are exempt from the target size rule (WCAG 2.5.8, inline).
      if (
        element.tagName === 'A' &&
        element.closest('p, li, dd') !== null &&
        element.closest('nav') === null
      )
        continue;
      const after = getComputedStyle(element, '::after');
      const hit =
        after.position === 'absolute'
          ? Math.min(Number.parseFloat(after.width), Number.parseFloat(after.height))
          : 0;
      const size = Math.max(Math.min(box.width, box.height), hit);
      if (size < smallest.size)
        smallest = {
          size,
          name: element.getAttribute('aria-label') ?? element.textContent.trim().slice(0, 30),
        };
    }
    return `${smallest.size.toFixed(1)}px (${smallest.name})`;
  });
}

async function shoot(
  browser: Browser,
  base: string,
  name: string,
  query: string,
  options: { width?: number; phone?: boolean; reducedMotion?: boolean; fold?: boolean } = {},
) {
  if (!wanted(name)) return null;
  const width = options.width ?? 1440;
  const page = await browser.newPage({
    viewport: { width, height: options.phone === true ? 844 : 900 },
    deviceScaleFactor: options.phone === true ? 2 : 1,
    ...(options.phone === true ? { isMobile: true, hasTouch: true } : {}),
    ...(options.reducedMotion === true ? { reducedMotion: 'reduce' as const } : {}),
  });
  await page.goto(`${base}?view=marketing&${query}`);
  await settle(page);
  if (options.fold === true) {
    await page.screenshot({ path: join(out, `${name}.png`) });
    return page;
  }
  await scrollThrough(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height });
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
      const query = `theme=${theme}&mode=${mode}`;
      const fold = await shoot(browser, base, `landing-fold-${theme}-${mode}`, query, {
        fold: true,
      });
      await fold?.close();
      const page = await shoot(browser, base, `landing-${theme}-${mode}`, query);
      await page?.close();
      const phone = await shoot(browser, base, `phone-landing-${theme}-${mode}`, query, {
        width: 390,
        phone: true,
      });
      if (phone !== null) {
        await phone.setViewportSize({ width: 390, height: 844 });
        console.log(
          `phone ${theme} ${mode}: overflow`,
          await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
          'px, smallest target',
          await smallestTarget(phone),
        );
        await phone.close();
      }
    }
  }

  for (const block of BLOCKS) {
    for (const [theme, mode] of [
      ['default', 'light'],
      ['ledger', 'dark'],
    ] as const) {
      const page = await shoot(
        browser,
        base,
        `block-${block}-${theme}-${mode}`,
        `block=${block}&theme=${theme}&mode=${mode}`,
      );
      await page?.close();
    }
  }
  for (const doc of ['terms', 'cookies']) {
    const page = await shoot(browser, base, `block-legal-${doc}`, `block=legal&doc=${doc}`);
    await page?.close();
  }
  const article = await shoot(browser, base, 'block-blog-article', 'block=blog&doc=article');
  await article?.close();
  const phoneArticle = await shoot(browser, base, 'phone-block-legal', 'block=legal&theme=ledger', {
    width: 390,
    phone: true,
  });
  await phoneArticle?.close();

  // Mobile menu open, and the cookie preferences open.
  if (wanted('menu')) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(`${base}?view=marketing&theme=default&mode=dark`);
    await settle(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await settle(page);
    await page.screenshot({ path: join(out, 'phone-menu-open.png') });
    await page.keyboard.press('Escape');
    await settle(page);
    console.log(
      'menu closed on Escape, focus back on',
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    );
    await page.close();
  }
  if (wanted('cookie-preferences')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}?view=marketing&theme=ledger&mode=light`);
    await settle(page);
    await page.getByRole('button', { name: 'Choose cookies' }).click();
    await settle(page);
    await page.screenshot({ path: join(out, 'cookie-preferences-open.png') });
    await page.close();
  }

  const calm = await shoot(browser, base, 'landing-reduced-motion', 'motion=on', {
    reducedMotion: true,
  });
  await calm?.close();

  // The motion variant's first view, frame by frame: entrances play once.
  if (wanted('motion')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}?view=marketing&motion=on`);
    await page.waitForFunction(() => document.querySelector('[data-slot="hero"]') !== null);
    await page.evaluate(() => document.fonts.ready);
    const frames = [0, 120, 260, 480, 900];
    for (const [index, ms] of frames.entries()) {
      await page.waitForTimeout(index === 0 ? 0 : ms - (frames[index - 1] ?? 0));
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
