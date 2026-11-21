/**
 * Headless captures of the built site for a design round: `pnpm --filter @rectio/site shoot 3`.
 * Build first (`pnpm --filter @rectio/site build`). Writes to .rounds/site-round-<n>/ at the repo
 * root (gitignored): every page on desktop and phone, light and dark, frame strips of the landing's scroll-driven parts, a scroll video of the landing, and
 * metrics.json (LCP, CLS, JS by page). `shoot 3 landing` captures the landing only. It serves out/
 * itself and never touches the screen.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { chromium, type Browser, type Page } from 'playwright';

import { BASE_PATH } from '../lib/base-path.ts';
import { serveStatic } from './static-server.ts';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const round = process.argv[2] ?? '1';
if (!/^\d+$/.test(round)) throw new Error(`round must be a number, got ${round}`);
const only = process.argv[3];
const out = join(site, '..', '..', '.rounds', `site-round-${round}`);
mkdirSync(out, { recursive: true });

const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'templates', path: '/templates' },
  { name: 'docs-intro', path: '/docs' },
  { name: 'docs-theming', path: '/docs/theming' },
  { name: 'docs-button', path: '/docs/components/button' },
  { name: 'docs-data-table', path: '/docs/components/data-table' },
  { name: 'docs-blocks', path: '/docs/blocks' },
  { name: 'docs-invoice-list', path: '/docs/blocks/invoice-list' },
  { name: 'docs-cash-flow', path: '/docs/blocks/cash-flow' },
  { name: 'docs-templates', path: '/docs/templates' },
  { name: 'docs-finance-app', path: '/docs/templates/finance-app' },
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
  options: { width: number; height: number; mobile: boolean; mode: string },
) {
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.mobile ? 2 : 1,
    isMobile: options.mobile,
    hasTouch: options.mobile,
    colorScheme: options.mode as 'light' | 'dark',
  });
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { context, page };
}

const served = await serveStatic(join(site, 'out'), 0, BASE_PATH);
const { server } = served;
/** Under SITE_BASE_PATH the site is served, and captured, at its base path. */
const base = served.url + BASE_PATH;
const browser = await chromium.launch();
const shots: string[] = [];

try {
  for (const view of VIEWPORTS) {
    for (const mode of MODES) {
      for (const entry of PAGES.filter((p) => only === undefined || p.name === only)) {
        const { context, page } = await openPage(browser, base, entry.path, { ...view, mode });
        await walk(page);
        await settle(page);
        const file = `${entry.name}-${view.name}-${mode}.png`;
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

  // Frame strips: the landing at fixed scroll positions through its scroll-driven parts (the hero
  // window settling, the pinned sequence, the mode curtain), one still each, then a contact sheet.
  for (const view of VIEWPORTS) {
    for (const mode of MODES) {
      const { context, page } = await openPage(browser, base, '/', { ...view, mode });
      await walk(page);
      await settle(page);
      const frames: string[] = [];
      const shoot = async (name: string) => {
        await page.waitForTimeout(900);
        const file = `strip-${view.name}-${mode}-${name}.png`;
        await page.screenshot({ path: join(out, file) });
        frames.push(file);
      };
      await shoot('00-top');
      for (const vh of [0.35, 0.7]) {
        await page.evaluate((f) => {
          scrollTo({ top: innerHeight * f, behavior: 'instant' });
        }, vh);
        await shoot(`01-window-${String(vh)}`);
      }
      const section = await page.evaluate(() => {
        const el = document.getElementById('close-books-title')?.closest('section');
        if (!el) return null;
        const top = el.getBoundingClientRect().top + scrollY;
        return { top, height: el.offsetHeight };
      });
      if (section !== null) {
        const travel = Math.max(0, section.height - view.height);
        for (let i = 0; i <= 8; i += 1) {
          await page.evaluate(
            (y) => {
              scrollTo({ top: y, behavior: 'instant' });
            },
            section.top + (travel * i) / 8,
          );
          await shoot(`02-sequence-${String(i)}`);
        }
      }
      // The curtain, then the registry once its terminal session has typed out and the block landed.
      for (const [name, text, wait] of [
        ['03-curtain', 'Light by day.', 900],
        ['04-registry', 'One command, and', 9000],
      ] as const) {
        const heading = page.getByText(text).first();
        await heading.evaluate((el) => {
          el.scrollIntoView({ block: 'start', behavior: 'instant' });
          scrollBy({ top: -96, behavior: 'instant' });
        });
        await page.waitForTimeout(wait);
        await shoot(name);
      }
      await context.close();
      // The contact sheet: every frame of this viewport and mode in one image.
      const sheet = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
      const cols = view.mobile ? 7 : 4;
      const cells = frames
        .map(
          (f) =>
            `<figure><img src="data:image/png;base64,${readFileSync(join(out, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`,
        )
        .join('');
      await sheet.setContent(
        `<style>body{margin:0;background:#888;font:12px monospace}main{display:grid;grid-template-columns:repeat(${String(cols)},1fr);gap:6px;padding:6px}img{width:100%;display:block}figure{margin:0}figcaption{padding:2px 0}</style><main>${cells}</main>`,
      );
      await sheet.screenshot({ path: join(out, `sheet-${view.name}-${mode}.png`), fullPage: true });
      await sheet.close();
    }
  }

  // Metrics: LCP and CLS on a cold load of each page, and the JavaScript it downloads.
  const metrics: Record<string, unknown> = {};
  for (const entry of PAGES.filter((p) => only === undefined || p.name === only)) {
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

  // A scroll video of the landing page, desktop light, switched to dark halfway.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    recordVideo: { dir: out, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // The mode switch of the curtain is pressed once it is well inside the viewport.
  const dark = page.getByRole('group', { name: 'Page mode' }).getByRole('button', {
    name: 'Dark',
  });
  let switched = false;
  for (let y = 0; y <= total; y += 14) {
    await page.mouse.wheel(0, 14);
    await page.waitForTimeout(16);
    if (!switched && (await dark.count()) > 0) {
      const box = await dark.boundingBox();
      if (box !== null && box.y > 200 && box.y < 600) {
        await dark.click();
        await page.waitForTimeout(1400);
        switched = true;
      }
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
