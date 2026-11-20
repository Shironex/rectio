/**
 * Contrast audit from real usage. Scans the class names in the kit's components, blocks, templates
 * and site, pairs every colour utility with the fill it is drawn on, and checks the pair in every
 * built theme and mode (and every dark proposal): WCAG 2.2 ratios as the gate, APCA Lc as a second
 * opinion.
 *
 *   node scripts/contrast.ts            summary per theme and mode, failures listed
 *   node scripts/contrast.ts --json f   every pair with its numbers, written to f
 *
 * Pairing rules. A text or edge colour pairs with the background named in the same class string
 * for the same state (hover:, data-[selected]: and so on), falling back to the string's base
 * background. With no background in the string, it pairs with the ambient surfaces a component can
 * sit on. Edges that identify a control or its state (strong borders, focus outlines, filled
 * indicators) gate at 3:1 (WCAG 1.4.11); decorative dividers and tints are reported, not gated.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { contrast, oklchToLinearSrgb, type Oklch } from './color.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');

/** Where the kit draws colour: components, blocks, motion twins, templates and the site. */
export const SCAN_ROOTS = [
  'packages/ui/src',
  'packages/motion/src',
  'packages/blocks/src',
  'templates/finance-app/app',
  'templates/finance-app/components',
  'templates/saas-admin/app',
  'templates/saas-admin/components',
  'apps/site/app',
  'apps/site/components',
];

/** Surfaces an element without its own fill can sit on. */
export const AMBIENT = ['surface', 'surface-canvas', 'surface-raised', 'surface-overlay'];

/**
 * Nested pairs a class scan cannot see, because the fill and the text live on different elements:
 * a selected row's secondary text, a hovered option's hint, a toast's status icon.
 */
export const NESTED: [fg: string, bg: string, min: number][] = [
  ['text-muted', 'surface-selected', 4.5],
  ['text-subtle', 'surface-selected', 4.5],
  ['text', 'surface-selected', 4.5],
  ['accent-strong', 'surface-selected', 4.5],
  ['text-muted', 'surface-hover', 4.5],
  ['text-subtle', 'surface-hover', 4.5],
  ['text', 'surface-hover', 4.5],
  ['accent-strong', 'surface-hover', 4.5],
  ['text-subtle', 'surface-inset', 4.5],
  ['text', 'surface-inset', 4.5],
  ['text-muted', 'surface-sunken', 4.5],
  ['text-subtle', 'surface-sunken', 4.5],
  ['text', 'accent-subtle', 4.5],
  ['accent-strong', 'accent-subtle', 4.5],
  ['positive-strong', 'positive-subtle', 4.5],
  ['negative-strong', 'negative-subtle', 4.5],
  ['warning-strong', 'warning-subtle', 4.5],
  ['info-strong', 'info-subtle', 4.5],
  ['text', 'chart-tooltip', 4.5],
  ['text-muted', 'chart-tooltip', 4.5],
  ['chart-axis', 'surface', 4.5],
  ['focus', 'surface-sunken', 3],
  ['focus', 'surface-hover', 3],
  ['border-strong', 'surface-sunken', 3],
  ...[1, 2, 3, 4, 5, 6].map((n): [string, string, number] => [
    `identity-${String(n)}-strong`,
    `identity-${String(n)}-subtle`,
    4.5,
  ]),
];

const UTILITY =
  /^(bg|text|border|ring|outline|fill|stroke|divide|decoration|caret|placeholder)-(surface|fg|line|accent|positive|negative|warning|info|focus|scrim|chart|identity|code)([a-z0-9-]*)(?:\/(\d+))?$/;
const RESPONSIVE =
  /^(sm|md|lg|xl|2xl|max-[a-z0-9]+|min-[a-z0-9[\]]+|motion-safe|motion-reduce|print|dark|light|forced-colors|pointer-coarse|pointer-fine|supports-.*)$/;

/** `fg-muted` to `text-muted`, `line` to `border`: the Tailwind colour name back to the token. */
export function tokenFor(group: string, rest: string): string {
  const base = group === 'fg' ? 'text' : group === 'line' ? 'border' : group;
  return `${base}${rest}`;
}

interface Use {
  kind: string;
  token: string;
  alpha: number;
  state: string;
}

function parseClass(cls: string): Use | undefined {
  const parts = cls.split(/:(?![^[]*\])/);
  const utility = parts.pop() ?? '';
  const m = UTILITY.exec(utility);
  if (m === null) return undefined;
  const [, kind = '', group = '', rest = '', alpha] = m;
  const state = parts.filter((p) => !RESPONSIVE.test(p)).join(':');
  return {
    kind,
    token: tokenFor(group, rest),
    alpha: alpha === undefined ? 1 : Number(alpha) / 100,
    state,
  };
}

export type Gate = 'text' | 'ui' | 'info';

export interface Pair {
  fg: string;
  fgAlpha: number;
  bg: string;
  bgAlpha: number;
  min: number;
  gate: Gate;
  /** exact: same class string; ambient: no fill in the string; nested: listed by hand. */
  source: 'exact' | 'ambient' | 'nested';
  where: string[];
}

const UI_EDGES = new Set([
  'border-strong',
  'text-subtle',
  'text-muted',
  'text',
  'accent',
  'accent-hover',
  'accent-strong',
  'negative',
  'negative-strong',
  'positive',
  'focus',
]);
const SOLID_MARK = /^(accent|positive|negative|warning|info)$/;

/** Ink that only ever sits on one fill. */
function partners(token: string): string[] | undefined {
  const fill = /^(accent|positive|negative|warning|info)-contrast$/.exec(token)?.[1];
  if (fill !== undefined)
    return [fill, ...(fill === 'accent' || fill === 'negative' ? [`${fill}-hover`] : [])];
  if (token === 'surface') return ['text'];
  if (/^code-(token-|foreground|line-number)/.test(token))
    return [
      'code-background',
      'code-highlight',
      ...(token === 'code-line-number' ? [] : ['code-inserted', 'code-deleted']),
    ];
  if (token === 'code-inserted-mark') return ['code-inserted'];
  if (token === 'code-deleted-mark') return ['code-deleted'];
  return undefined;
}
const INDICATOR_FILLS =
  /^(accent|accent-hover|accent-active|positive|negative|warning|info|border-strong|text-subtle|text-muted|text|chart-series-\d|chart-sequence-\d)$/;

function classify(use: Use): { gate: Gate; min: number } | undefined {
  // A surface step as currentColor paints a skeleton shape or a gap ring: decorative.
  if (use.kind === 'text' && use.token.startsWith('surface-')) return { gate: 'info', min: 3 };
  if (use.kind === 'text' || use.kind === 'placeholder') {
    if (use.token.startsWith('text-disabled')) return { gate: 'text', min: 3 };
    return { gate: 'text', min: 4.5 };
  }
  if (use.kind === 'fill' && use.token.startsWith('chart-axis')) return { gate: 'text', min: 4.5 };
  if (['border', 'ring', 'outline', 'stroke'].includes(use.kind)) {
    if (use.alpha < 1) return { gate: 'info', min: 3 };
    if (UI_EDGES.has(use.token)) return { gate: 'ui', min: 3 };
    return { gate: 'info', min: 3 };
  }
  if (use.kind === 'divide' || use.kind === 'decoration' || use.kind === 'caret')
    return { gate: 'info', min: 3 };
  return undefined;
}

function* files(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx|ts)$/.test(name) && !/\.(test|spec|stories)\.tsx?$/.test(name)) yield path;
  }
}

/** String literals that hold at least one colour utility. */
function classStrings(source: string): string[] {
  const out: string[] = [];
  // Block comments go first; quoted strings never cross a line, so an apostrophe in JSX text or a
  // comment cannot swallow the class names after it. Template literals may span lines.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
    const body = m[1] ?? m[2] ?? m[3] ?? '';
    if (
      /(?:^|[\s:])(?:bg|text|border|ring|outline|fill|stroke|divide)-(?:surface|fg|line|accent|positive|negative|warning|info|focus|chart|identity|code)/.test(
        body,
      )
    )
      out.push(body);
  }
  return out;
}

/** Every colour pair the kit draws, derived from its class names. */
export function derivePairs(roots = SCAN_ROOTS): Pair[] {
  const pairs = new Map<string, Pair>();
  const add = (p: Omit<Pair, 'where'>, where: string) => {
    const key = `${p.fg}/${String(p.fgAlpha)}|${p.bg}/${String(p.bgAlpha)}|${p.gate}|${p.source}`;
    const existing = pairs.get(key);
    if (existing === undefined) pairs.set(key, { ...p, where: [where] });
    else if (!existing.where.includes(where)) existing.where.push(where);
  };
  for (const root of roots) {
    for (const file of files(join(repo, root))) {
      const where = relative(repo, file);
      for (const str of classStrings(readFileSync(file, 'utf8'))) {
        const uses = str
          .split(/\s+/)
          .map(parseClass)
          .filter((u): u is Use => u !== undefined);
        const bgs = uses.filter((u) => u.kind === 'bg');
        const bgFor = (state: string) =>
          bgs.filter((b) => b.state === state).at(-1) ?? bgs.filter((b) => b.state === '').at(-1);
        const hasText = uses.some((u) => u.kind === 'text');
        const insetOutline = /(?:^|\s)-outline-offset-|outline-offset-\[-/.test(str);
        for (const use of uses) {
          let rule = classify(use);
          // A fill with no text on it is an indicator (a dot, a checked box, a bar, a thumb). Hover
          // and press fills are not: the label they hold identifies the control.
          if (
            rule === undefined &&
            use.kind === 'bg' &&
            !hasText &&
            use.alpha === 1 &&
            !/hover|focus|active/.test(use.state) &&
            INDICATOR_FILLS.test(use.token)
          )
            rule = { gate: 'ui', min: 3 };
          if (rule === undefined) continue;
          const own = use.kind === 'bg' ? undefined : bgFor(use.state);
          const partner = partners(use.token);
          const edge = ['border', 'ring', 'divide', 'stroke'].includes(use.kind);
          const ownCounts =
            own !== undefined &&
            own.token !== use.token &&
            !(use.kind === 'outline' && !insetOutline) &&
            !(edge && !/^surface|subtle$/.test(own.token));
          if (ownCounts) {
            add(
              {
                fg: use.token,
                fgAlpha: use.alpha,
                bg: own.token,
                bgAlpha: own.alpha,
                ...rule,
                source: 'exact',
              },
              where,
            );
            if (!edge) continue;
          }
          if (partner !== undefined && !ownCounts) {
            // Ink made for one fill (accent-contrast on accent, inverse text on a tooltip).
            for (const bg of partner)
              add(
                { fg: use.token, fgAlpha: use.alpha, bg, bgAlpha: 1, ...rule, source: 'exact' },
                where,
              );
            continue;
          }
          // A solid status colour with no fill of its own is a mark (an icon, a ring, a stroke).
          const ambientRule =
            use.kind === 'text' && SOLID_MARK.test(use.token)
              ? { gate: 'ui' as const, min: 3 }
              : rule;
          for (const bg of AMBIENT)
            add(
              {
                fg: use.token,
                fgAlpha: use.alpha,
                bg,
                bgAlpha: 1,
                ...ambientRule,
                source: 'ambient',
              },
              where,
            );
        }
      }
    }
  }
  for (const [fg, bg, min] of NESTED)
    add(
      { fg, fgAlpha: 1, bg, bgAlpha: 1, min, gate: min >= 4.5 ? 'text' : 'ui', source: 'nested' },
      'nested',
    );
  return [...pairs.values()];
}

/* Colour parsing and APCA. */

export function parseOklch(value: string | undefined): Oklch | undefined {
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value ?? '');
  if (m === null) return undefined;
  return { l: Number(m[1]) / 100, c: Number(m[2]), h: Number(m[3]), alpha: Number(m[4] ?? 1) };
}

const encode = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
};

export function toSrgb(color: Oklch): [number, number, number] {
  const [r, g, b] = oklchToLinearSrgb(color);
  return [encode(r), encode(g), encode(b)];
}

export function toHex(color: Oklch): string {
  return `#${toSrgb(color)
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Composites a translucent colour over an opaque one, in gamma sRGB (what browsers do). */
function over(top: Oklch, alpha: number, bottom: Oklch): [number, number, number] {
  const a = alpha * (top.alpha ?? 1);
  const t = toSrgb(top);
  const b = toSrgb(bottom);
  return [0, 1, 2].map((i) => a * (t[i] ?? 0) + (1 - a) * (b[i] ?? 0)) as [number, number, number];
}

function apcaY([r, g, b]: [number, number, number]): number {
  const y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
}

/** APCA 0.0.98G lightness contrast, Lc. Positive for dark text on light, negative for light on dark. */
export function apcaLc(text: [number, number, number], bg: [number, number, number]): number {
  const yt = apcaY(text);
  const yb = apcaY(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

const wcagY = ([r, g, b]: [number, number, number]) => {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export interface Result extends Pair {
  ratio: number;
  lc: number;
  pass: boolean;
}

/** Checks every pair against one resolved token set (`--rx-*` names to oklch strings). */
export function evaluate(tokens: Record<string, string>, pairs: Pair[]): Result[] {
  const backdrop = parseOklch(tokens['--rx-surface']);
  return pairs.flatMap((pair) => {
    const fg = parseOklch(tokens[`--rx-${pair.fg}`]);
    const bgRaw = parseOklch(tokens[`--rx-${pair.bg}`]);
    if (fg === undefined || bgRaw === undefined || backdrop === undefined) return [];
    const bg =
      pair.bgAlpha < 1 || (bgRaw.alpha ?? 1) < 1
        ? over(bgRaw, pair.bgAlpha, backdrop)
        : toSrgb(bgRaw);
    const bgColor: Oklch = { ...bgRaw, alpha: 1 };
    const fgRgb =
      pair.fgAlpha < 1 || (fg.alpha ?? 1) < 1
        ? (() => {
            const a = pair.fgAlpha * (fg.alpha ?? 1);
            const t = toSrgb(fg);
            return [0, 1, 2].map((i) => a * (t[i] ?? 0) + (1 - a) * (bg[i] ?? 0)) as [
              number,
              number,
              number,
            ];
          })()
        : toSrgb(fg);
    const ya = wcagY(fgRgb);
    const yb = wcagY(bg);
    const ratio =
      pair.bgAlpha === 1 && pair.fgAlpha === 1
        ? contrast(fg, bgColor)
        : (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
    const lc = apcaLc(fgRgb, bg);
    return [{ ...pair, ratio, lc, pass: pair.gate === 'info' || ratio >= pair.min }];
  });
}

interface Built {
  themes: Record<string, Record<string, Record<string, string>>>;
  proposals?: Record<string, Record<string, Record<string, string>>>;
}

/** Every resolved token set in dist/tokens.json: shipped theme modes, then dark proposals. */
export function tokenSets(): { key: string; tokens: Record<string, string> }[] {
  const built = JSON.parse(readFileSync(join(here, '..', 'dist', 'tokens.json'), 'utf8')) as Built;
  const sets = Object.entries(built.themes).flatMap(([theme, modes]) =>
    Object.entries(modes).map(([mode, tokens]) => ({ key: `${theme}/${mode}`, tokens })),
  );
  for (const [name, themes] of Object.entries(built.proposals ?? {}))
    for (const [theme, tokens] of Object.entries(themes))
      sets.push({ key: `${theme}/dark-${name}`, tokens });
  return sets;
}

function main() {
  const pairs = derivePairs();
  const jsonAt = process.argv.indexOf('--json');
  const report: Record<string, Result[]> = {};
  const counts = { exact: 0, ambient: 0, nested: 0 };
  for (const p of pairs) counts[p.source] += 1;
  console.log(
    `${String(pairs.length)} pairs from usage (${String(counts.exact)} same element, ${String(counts.ambient)} on ambient surfaces, ${String(counts.nested)} nested)`,
  );
  let failed = 0;
  for (const { key, tokens } of tokenSets()) {
    const results = evaluate(tokens, pairs);
    report[key] = results;
    const gated = results.filter((r) => r.gate !== 'info');
    const fails = gated.filter((r) => !r.pass);
    const unique = [...new Map(fails.map((f) => [`${f.fg}|${f.bg}`, f])).values()];
    failed += unique.length;
    console.log(
      `${key.padEnd(24)} ${String(gated.length - fails.length).padStart(4)}/${String(gated.length)} pass` +
        (unique.length > 0 ? `  FAIL ${String(unique.length)}` : ''),
    );
    for (const f of unique.slice(0, 40))
      console.log(
        `    ${f.fg}${f.fgAlpha < 1 ? `/${String(f.fgAlpha)}` : ''} on ${f.bg}${f.bgAlpha < 1 ? `/${String(f.bgAlpha)}` : ''}: ${f.ratio.toFixed(2)} < ${String(f.min)} (Lc ${f.lc.toFixed(0)}, ${f.where[0] ?? ''})`,
      );
  }
  if (jsonAt > 0) {
    const target = process.argv[jsonAt + 1];
    if (target === undefined) throw new Error('--json needs a file');
    writeFileSync(target, JSON.stringify({ pairs: pairs.length, report }, null, 1));
  }
  process.exitCode = failed > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
