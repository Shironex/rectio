/**
 * Touch target audit on a phone: `pnpm audit:touch [view] [skin]`. Starts its own Vite server,
 * opens every playground view at 390 wide with touch emulation (so `pointer: coarse` matches) and
 * measures the real hit area of every control on the page by hit testing: from the centre of the
 * control it walks out in each direction until a tap would land on something else. A pseudo element
 * hit area counts, a neighbour that covers part of it does not. Prints each control under 44 by 44,
 * then a total, and exits non zero when one is found. Never touches the screen.
 *
 * Text links inside running text are listed apart: the target size rule exempts them.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Page } from 'playwright';
import { createServer } from 'vite';

import { SKINS } from '../src/themes.ts';

const here = dirname(fileURLToPath(import.meta.url));
const VIEWS = [
  'matrix',
  'app',
  'blocks',
  'display',
  'marketing',
  'docs',
  'forms',
  'shell',
  'nav',
  'gaps',
  'primitives',
  'charts',
  'scheduling',
  'chat',
  'viz',
] as const;
const onlyView = process.argv[2];
const onlySkin = process.argv[3];
/** The lane's port range starts here; Vite moves up if it is taken. */
const PORT = 4430;
const TARGET = 44;

interface Finding {
  name: string;
  slot: string;
  width: number;
  height: number;
  inline: boolean;
  /** What a tap lands on just past the short side: a neighbour, or nothing (the area ends). */
  blocker: string;
}

/** Touch height tokens that resolve under `target` px here, plain and under compact density. */
function touchTokens(target: number): string[] {
  const names = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules))
      for (const m of rule.cssText.matchAll(/(--rx-[\w-]*touch[\w-]*)\s*:/g))
        if (m[1] !== undefined) names.add(m[1]);
  }
  const host = document.querySelector('[data-skin]') ?? document.body;
  const short: string[] = [];
  for (const compact of [false, true]) {
    const wrap = document.createElement('div');
    if (compact) wrap.dataset.density = 'compact';
    host.append(wrap);
    for (const name of names) {
      const probe = document.createElement('div');
      probe.style.height = `var(${name})`;
      wrap.append(probe);
      const h = probe.getBoundingClientRect().height;
      if (h < target)
        short.push(`${name}${compact ? ' (compact)' : ''} resolves to ${String(h)}px`);
    }
    wrap.remove();
  }
  return short;
}

async function settle(page: Page) {
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
}

/** Runs in the page: hit tests every visible control and returns the ones under the target. */
function measure(target: number): Finding[] {
  const selector = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'summary',
    '[role="button"]',
    '[role="checkbox"]',
    '[role="switch"]',
    '[role="radio"]',
    '[role="tab"]',
    '[role="slider"]',
    '[role="combobox"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="spinbutton"]',
    '[role="treeitem"]',
    '[role="gridcell"] button',
    // A half-star rating on a touch screen takes taps on the whole star, not on its halves.
    '[data-slot="rating-star"]:has([data-slot="rating-item"] + [data-slot="rating-item"])',
  ].join(', ');
  const reach = target + 8;
  const findings: Finding[] = [];
  const seen = new Set<Element>();
  // Controls already measured at an earlier scroll position carry a mark.
  const MARK = 'rxAudited';
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    // A control inside another control (an input inside a role=combobox wrapper) is measured once.
    const outer = element.parentElement?.closest(selector);
    const node: HTMLElement =
      outer instanceof HTMLElement && outer.contains(element) && outer.tagName !== 'A'
        ? outer
        : element;
    if (seen.has(node) || node.dataset[MARK] !== undefined) continue;
    seen.add(node);
    const box = node.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    if (node.closest('[hidden], [aria-hidden="true"], .sr-only, [inert]') !== null) continue;
    const style = getComputedStyle(node);
    if (style.visibility === 'hidden' || style.pointerEvents === 'none') continue;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    // Only controls well inside the viewport, so the walk never leaves it; the rest wait for a
    // later scroll position.
    if (cx < 0 || cx > innerWidth || cy < reach || cy > innerHeight - reach) continue;
    node.dataset[MARK] = '';
    // A control's own label counts: tapping it reaches the control.
    const label =
      node.closest('label') ??
      (node.id ? document.querySelector(`label[for="${CSS.escape(node.id)}"]`) : null);
    // The border of the field that frames the control counts too: it is part of the drawn field,
    // and touch adjustment sends a tap there to the control inside.
    const onFrame = (hit: Element, x: number, y: number) => {
      if (!hit.contains(node)) return false;
      const frame = hit.getBoundingClientRect();
      const s = getComputedStyle(hit);
      const top = Number.parseFloat(s.borderTopWidth);
      const bottom = Number.parseFloat(s.borderBottomWidth);
      const left = Number.parseFloat(s.borderLeftWidth);
      const right = Number.parseFloat(s.borderRightWidth);
      return (
        (top > 0 && y < frame.top + top) ||
        (bottom > 0 && y > frame.bottom - bottom) ||
        (left > 0 && x < frame.left + left) ||
        (right > 0 && x > frame.right - right)
      );
    };
    // A text input drawn inside a field frame (an input group, a chip field) is reached through the
    // whole frame: the kit's frames send a press on their padding to the input.
    let frame: Element | null = null;
    if (node.matches('input, textarea, [role="combobox"]')) {
      for (
        let up = node.parentElement, depth = 0;
        up !== null && depth < 3;
        up = up.parentElement, depth++
      ) {
        if (Number.parseFloat(getComputedStyle(up).borderTopWidth) > 0) {
          frame = up;
          break;
        }
      }
    }
    const hits = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      if (hit === null) return false;
      return (
        node.contains(hit) ||
        label?.contains(hit) === true ||
        (frame !== null && frame.contains(hit) && hit.closest(selector) === null) ||
        onFrame(hit, x, y)
      );
    };
    if (!hits(cx, cy)) continue; // covered: an overlay or a visually hidden native input
    // Partly scrolled out of a scroll box: measured when it is in view, not cut by the box's edge.
    let clipped = false;
    for (let up = node.parentElement; up !== null && up !== document.body; up = up.parentElement) {
      const s = getComputedStyle(up);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      if (up.scrollHeight <= up.clientHeight + 1 && up.scrollWidth <= up.clientWidth + 1) continue;
      const r = up.getBoundingClientRect();
      if (box.top < r.top || box.bottom > r.bottom || box.left < r.left || box.right > r.right)
        clipped = true;
    }
    if (clipped) continue;
    const walk = (dx: number, dy: number) => {
      let step = 0;
      while (step < reach && hits(cx + dx * (step + 1), cy + dy * (step + 1))) step++;
      return step;
    };
    const left = walk(-1, 0);
    const right = walk(1, 0);
    const up = walk(0, -1);
    const down = walk(0, 1);
    const width = left + right + 1;
    const height = up + down + 1;
    // The nearest edge on the short axis, and what a tap just past it lands on.
    const past =
      width < height
        ? document.elementFromPoint(left < right ? cx - left - 1 : cx + right + 1, cy)
        : document.elementFromPoint(cx, up < down ? cy - up - 1 : cy + down + 1);
    const blocker =
      past === null
        ? 'none'
        : `${past.tagName.toLowerCase()}${past instanceof HTMLElement && past.dataset.slot ? `[${past.dataset.slot}]` : ''}`;
    // The walk goes in whole pixels from a centre that is often fractional, so it can read one pixel
    // short of the box: a target of 44 passes at 43.
    if (width >= target - 1 && height >= target - 1) continue;
    // Cut by a fixed layer (a cookie banner pinned to the viewport) that only covers it at this
    // scroll position: not a property of the control.
    if (past !== null) {
      let layer: Element | null = past;
      while (layer !== null && getComputedStyle(layer).position !== 'fixed')
        layer = layer.parentElement;
      if (layer !== null && !layer.contains(node)) continue;
    }
    // A link or citation inside running text: inline, with words of its own sentence around it.
    const parent = node.parentElement;
    const inline =
      style.display.startsWith('inline') &&
      parent !== null &&
      parent.textContent.replace(node.textContent, '').trim() !== '' &&
      getComputedStyle(parent).display === 'block';
    const slot =
      node.dataset.slot ??
      node.closest<HTMLElement>('[data-slot]')?.dataset.slot ??
      node.tagName.toLowerCase();
    findings.push({
      name: (node.getAttribute('aria-label') ?? node.textContent).trim().slice(0, 32),
      slot,
      width,
      height,
      inline,
      blocker,
    });
  }
  return findings;
}

const server = await createServer({
  root: join(here, '..'),
  server: { port: PORT, strictPort: false },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

const browser = await chromium.launch();
let failures = 0;
try {
  const looks = ['', ...SKINS].filter((s) => onlySkin === undefined || s === onlySkin);
  for (const view of VIEWS) {
    if (onlyView !== undefined && onlyView !== 'all' && view !== onlyView) continue;
    for (const skin of looks) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      await page.goto(`${base}?view=${view}${skin ? `&skin=${skin}` : ''}`);
      await settle(page);
      // A tall viewport, scrolled in steps that overlap, so every control is measured on screen.
      const VIEWPORT = 3000;
      await page.setViewportSize({ width: 390, height: VIEWPORT });
      await settle(page);
      const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
      if (!coarse) throw new Error('touch emulation did not match pointer: coarse');
      // Every touch height token, resolved by the browser under this look (and with compact density
      // on top), must reach the target exactly: the hit-area walk below allows a pixel of rounding,
      // which would hide a token that comes out at 43.5px.
      const short = await page.evaluate(touchTokens, TARGET);
      for (const s of short) console.log(`  token ${s}`);
      failures += short.length;
      const findings: Finding[] = [];
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += VIEWPORT - 400) {
        await page.evaluate((top) => {
          window.scrollTo(0, top);
        }, y);
        findings.push(...(await page.evaluate(measure, TARGET)));
      }
      const real = findings.filter((f) => !f.inline);
      const inline = findings.length - real.length;
      failures += real.length;
      console.log(
        `${view}${skin ? ` (${skin})` : ''}: ${String(real.length)} under ${String(TARGET)}px` +
          (inline > 0 ? `, ${String(inline)} inline text links exempt` : ''),
      );
      const grouped = new Map<string, { count: number; f: Finding }>();
      for (const f of real) {
        const key = `${f.slot} ${String(f.width)}x${String(f.height)} ${f.name}`;
        const entry = grouped.get(key);
        if (entry) entry.count++;
        else grouped.set(key, { count: 1, f });
      }
      for (const { count, f } of grouped.values())
        console.log(
          `  ${f.slot.padEnd(24)} ${String(f.width).padStart(3)}x${String(f.height).padEnd(3)} ${f.name}${count > 1 ? ` (x${String(count)})` : ''}  <- ${f.blocker}`,
        );
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`total under ${String(TARGET)}px: ${String(failures)}`);
process.exitCode = failures > 0 ? 1 : 0;
