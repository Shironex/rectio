/**
 * Headless captures of the built site for a design round: `pnpm --filter @rectio/site shoot 3`.
 * Build first (`pnpm --filter @rectio/site build`). Writes to .rounds/site-round-<n>/ at the repo
 * root (gitignored): every page on desktop and phone, light and dark, both site themes for the
 * landing, a scroll video of the landing, and metrics.json (LCP, CLS, JS by page). It serves out/
 * itself and never touches the screen.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { chromium, type Browser, type Page } from 'playwright';

import { serveStatic } from './static-server.ts';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
const out = join(site, '..', '..', '.rounds', `site-round-${round}`);
mkdirSync(out, { recursive: true });

const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'docs-intro', path: '/docs' },
  { name: 'docs-theming', path: '/docs/theming' },
  { name: 'docs-button', path: '/docs/components/button' },
  { name: 'docs-data-table', path: '/docs/components/data-table' },
] as const;
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
] as const;
const MODES = ['light', 'dark'] as const;

/** Wait for fonts and every finite animation, so a shot never catches a half state. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // The landing terminal types once it is seen; let it finish so stills show the whole session.
  await page.waitForFunction(() => document.querySelector('[data-typing]') === null, undefined, {
    timeout: 15000,
  });
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every(
          (a) =>
            a.playState !== 'running' ||
            a.effect?.getTiming().iterations === Infinity ||
            a.timeline !== document.timeline,
        ),
    undefined,
    { timeout: 10_000 },
  );
}

/** Scroll through the page in steps so scroll-driven reveals and in-view triggers have run. */
async function walk(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => innerHeight * 0.6);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => {
      scrollTo({ top, behavior: 'instant' });
    }, y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => {
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(200);
}

async function openPage(
  browser: Browser,
  base: string,
  path: string,
  options: { width: number; height: number; mobile: boolean; mode: string; theme: string },
) {
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.mobile ? 2 : 1,
    isMobile: options.mobile,
    hasTouch: options.mobile,
    colorScheme: options.mode as 'light' | 'dark',
  });
  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('rectio-site-theme', theme);
    } catch {
      // A capture without storage shows the default theme.
    }
  }, options.theme);
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { context, page };
}

const { server, url: base } = await serveStatic(join(site, 'out'));
const browser = await chromium.launch();
const shots: string[] = [];

try {
  for (const view of VIEWPORTS) {
    for (const mode of MODES) {
      for (const entry of PAGES) {
        const themes = entry.name === 'landing' ? ['default', 'ledger'] : ['default'];
        for (const theme of themes) {
          const { context, page } = await openPage(browser, base, entry.path, {
            ...view,
            mode,
            theme,
          });
          await walk(page);
          await settle(page);
          const file = `${entry.name}-${theme}-${view.name}-${mode}.png`;
          await page.screenshot({ path: join(out, `fold-${file}`) });
          // A full-page still is taken in one frame, so scroll-linked reveals below the fold have
          // not run in it. Show them at rest for this still; the fold shot and video keep motion.
          await page.addStyleTag({ content: '.site-reveal { animation: none !important; }' });
          await page.screenshot({ path: join(out, file), fullPage: true });
          shots.push(file);
          await context.close();
        }
      }
    }
  }

  // Metrics: LCP and CLS on a cold load of each page, and the JavaScript it downloads.
  const metrics: Record<string, unknown> = {};
  for (const entry of PAGES) {
    for (const view of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        isMobile: view.mobile,
      });
      const page = await context.newPage();
      const scripts = new Set<string>();
      page.on('response', (response) => {
        if (response.request().resourceType() === 'script')
          scripts.add(new URL(response.url()).pathname);
      });
      await page.addInitScript(() => {
        const w = window as unknown as { __lcp: number; __cls: number; __lcpEl: string | null };
        w.__lcp = 0;
        w.__cls = 0;
        w.__lcpEl = null;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as (PerformanceEntry & {
            element?: Element | null;
          })[]) {
            w.__lcp = e.startTime;
            const el = e.element;
            w.__lcpEl =
              el == null
                ? null
                : `${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 60)}`;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as (PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          })[])
            if (!e.hadRecentInput) w.__cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      // Phones are measured as a mid-range phone on a fast 4G link, desktops unthrottled.
      if (view.mobile) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 150,
          downloadThroughput: (9 * 1024 * 1024) / 8,
          uploadThroughput: (1.5 * 1024 * 1024) / 8,
        });
      }
      await page.goto(base + entry.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const { lcp, cls, lcpElement } = await page.evaluate(() => {
        const w = window as unknown as { __lcp: number; __cls: number; __lcpEl: string | null };
        return { lcp: Math.round(w.__lcp), cls: Number(w.__cls.toFixed(4)), lcpElement: w.__lcpEl };
      });
      let raw = 0;
      let gzip = 0;
      for (const path of scripts) {
        const bytes = readFileSync(join(site, 'out', decodeURIComponent(path)));
        raw += bytes.length;
        gzip += gzipSync(bytes).length;
      }
      metrics[`${entry.name}/${view.name}`] = {
        throttled: view.mobile ? '4x CPU, 9 Mbps, 150 ms' : 'none',
        lcpMs: lcp,
        lcpElement,
        cls,
        scripts: scripts.size,
        jsKb: Math.round(raw / 1024),
        jsGzipKb: Math.round(gzip / 1024),
      };
      await context.close();
    }
  }
  writeFileSync(join(out, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`);
  console.log(JSON.stringify(metrics, null, 2));

  // A scroll video of the landing page, desktop light, with the theme switched halfway.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    recordVideo: { dir: out, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let switched = false;
  for (let y = 0; y <= total; y += 14) {
    await page.mouse.wheel(0, 14);
    await page.waitForTimeout(16);
    if (!switched && y > total * 0.3) {
      const ledger = page.getByRole('button', { name: 'Ledger' }).first();
      if (await ledger.isVisible()) {
        await ledger.click();
        await page.waitForTimeout(1400);
      }
      switched = true;
    }
  }
  await page.waitForTimeout(600);
  const video = page.video();
  await context.close();
  if (video !== null) renameSync(await video.path(), join(out, 'landing-scroll.webm'));

  console.log(`site round ${round}: ${String(shots.length)} shots, metrics and video in ${out}`);
} finally {
  await browser.close();
  server.close();
}
