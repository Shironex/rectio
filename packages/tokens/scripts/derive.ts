/**
 * Theme derivation: a handful of inputs (brand hue and chroma, neutral hue and chroma, dark surface
 * depth, how ink sits on solid fills) to every colour token, in OKLCH, then corrected until every
 * pair from scripts/contrast.ts passes WCAG 2.2 AA.
 *
 *   node scripts/derive.ts    writes the dark proposals to src/proposals/default/<name>.json
 *
 * The same functions back the theme generator: derive(), then correct() against derivePairs().
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fitSrgb, formatOklch, type Oklch } from './color.ts';
import { derivePairs, evaluate, type Pair } from './contrast.ts';
import { cssVarName } from './naming.ts';

const here = dirname(fileURLToPath(import.meta.url));

export interface Preset {
  name: string;
  label: string;
  /** The accent: hue in degrees and the chroma of its light-mode solid. */
  brand: { hue: number; chroma: number };
  /** Surface tint: warm about 60 to 90, cool about 230 to 260; chroma 0 to 0.015. */
  neutral: { hue: number; chroma: number };
  /** Text and ink tint; defaults to the neutral. */
  ink?: { hue: number; chroma: number };
  /** Lightness of the dark canvas, 0.11 (near black) to 0.22 (soft charcoal). */
  depth: number;
  /** Lightness steps above the canvas: surface, raised, overlay, hover. */
  steps?: [number, number, number, number];
  /** Primary text lightness in dark mode, 0.9 to 0.96. */
  text?: number;
  /**
   * Ink on solid fills. `light`: a mid solid with near-white ink (as the light theme). `dark`: a
   * light solid with dark ink. `ink`: the solid is the ink colour and the brand is the text on it
   * (a ledger style), light mode only.
   */
  solids: { light: 'light' | 'ink'; dark: 'light' | 'dark' };
  /** Lightness of the dark accent solid; defaults to 0.56 (white ink) or the hue's cusp (dark ink). */
  accentL?: number;
  /** Chroma of the selected fill in dark mode: a tint, never a block. */
  selectedChroma?: number;
}

export type Mode = 'light' | 'dark';
export type TokenSet = Map<string, Oklch>;

const o = (l: number, c: number, h: number, alpha = 1): Oklch =>
  fitSrgb({
    l: Math.min(0.995, Math.max(0, l)),
    c: Math.max(0, c),
    h: ((h % 360) + 360) % 360,
    alpha,
  });

/** Lightness where a hue reaches its widest sRGB chroma (about 0.45 for blue, 0.95 for lime). */
export function cuspLightness(hue: number): number {
  let best = 0.5;
  let widest = 0;
  for (let l = 0.3; l <= 0.98; l += 0.01) {
    const c = fitSrgb({ l, c: 0.4, h: hue }).c;
    if (c > widest) {
      widest = c;
      best = l;
    }
  }
  return best;
}

const STATUS = {
  positive: 152,
  negative: 26,
  warning: 72,
  info: 232,
} as const;
const IDENTITY_HUES = (brand: number) => [brand, 152, 72, 232, 48, 108];
const SEQUENCE = [
  // [hue, light L, light C, dark L, dark C]; step 1 is the brand (calm), step 5 the most severe.
  [78, 0.625, 0.13, 0.9, 0.105],
  [50, 0.52, 0.128, 0.79, 0.14],
  [20, 0.4, 0.16, 0.66, 0.19],
  [340, 0.3, 0.13, 0.6, 0.19],
] as const;

/** Every colour role for one mode, before correction. */
export function derive(p: Preset, mode: Mode): TokenSet {
  const t: TokenSet = new Map();
  const set = (name: string, c: Oklch) => t.set(`--rx-${name}`, c);
  const nh = p.neutral.hue;
  const nc = p.neutral.chroma;
  const ih = p.ink?.hue ?? nh;
  const ic = p.ink?.chroma ?? nc;
  const bh = p.brand.hue;
  const bc = p.brand.chroma;
  const n = (l: number, scale = 1) => o(l, nc * scale, nh);
  const ink = (l: number) => o(l, ic, ih);
  const brand = (l: number, c: number) => o(l, Math.min(c, bc), bh);

  if (mode === 'light') {
    const inkStyle = p.solids.light === 'ink';
    set('surface-canvas', n(0.964));
    set('surface', n(0.988));
    set('surface-raised', n(0.995));
    set('surface-sunken', n(0.946));
    set('surface-overlay', n(0.995));
    set('surface-hover', n(0.946));
    set('surface-selected', inkStyle ? brand(0.988, 0.06) : brand(0.946, 0.0256));
    set('surface-inset', n(0.964));
    set('surface-placeholder', n(0.895));
    set('surface-placeholder-shine', n(0.988));
    set('text', ink(0.21));
    set('text-muted', ink(0.455));
    set('text-subtle', ink(0.505));
    set('text-disabled', ink(0.62));
    set('border', n(0.895));
    set('border-strong', ink(0.62));
    if (inkStyle) {
      set('accent', ink(0.28));
      set('accent-hover', ink(0.375));
      set('accent-active', ink(0.21));
      set('accent-subtle', brand(0.946, 0.12));
      set('accent-strong', ink(0.375));
      set('accent-contrast', brand(0.946, 0.12));
      set('focus', ink(0.28));
    } else {
      set('accent', brand(0.53, bc));
      set('accent-hover', brand(0.455, bc));
      set('accent-active', brand(0.375, bc));
      set('accent-subtle', brand(0.976, 0.0113));
      set('accent-strong', brand(0.455, bc));
      set('accent-contrast', n(0.995));
      set('focus', brand(0.62, 0.1623));
    }
    const subtleC = { positive: 0.0377, negative: 0.0117, warning: 0.018, info: 0.0138 };
    const solidC = { positive: 0.1395, negative: 0.1936, warning: 0.1552, info: 0.1082 };
    for (const [role, hue] of Object.entries(STATUS) as [keyof typeof STATUS, number][]) {
      const warn = role === 'warning';
      set(role, o(warn ? 0.72 : 0.53, solidC[role], hue));
      set(`${role}-subtle`, o(0.976, subtleC[role], hue));
      set(`${role}-strong`, warn ? o(0.375, 0.0845, 64.7) : o(0.455, solidC[role] * 0.86, hue));
      set(`${role}-contrast`, warn ? n(0.178) : n(0.995));
    }
    set('negative-hover', o(0.455, 0.1688, STATUS.negative));
    set('scrim', o(0.18, 0.008, nh, 0.36));
    set('chart-series-1', inkStyle ? ink(0.375) : brand(0.53, bc));
    set('chart-series-2', o(0.62, 0.169, 48));
    set('chart-series-3', inkStyle ? o(0.53, 0.1082, 232) : ink(0.28));
    set('chart-sequence-1', inkStyle ? ink(0.62) : brand(0.62, 0.1623));
    SEQUENCE.forEach(([h, l, c], i) => set(`chart-sequence-${String(i + 2)}`, o(l, c, h)));
    set('chart-grid', n(0.922));
    set('chart-axis', ink(0.53));
    set('chart-baseline', ink(0.62));
    set('chart-reference', ink(0.72));
    set('chart-tooltip', n(0.995));
    set('chart-tooltip-border', n(0.895));
    set('chart-halo', n(0.988));
    const idSubtle = [0.0256, 0.0507, 0.0412, 0.0314, 0.0243, 0.1216];
    const idStrong = [0.1544, 0.0989, 0.0845, 0.0767, 0.1024, 0.0835];
    IDENTITY_HUES(bh).forEach((h, i) => {
      set(`identity-${String(i + 1)}-subtle`, o(0.946, idSubtle[i] ?? 0.03, h));
      set(`identity-${String(i + 1)}-strong`, o(0.375, idStrong[i] ?? 0.09, h));
    });
    set('code-background', n(0.976));
    set('code-foreground', ink(0.21));
    set('code-highlight', inkStyle ? brand(0.995, 0.023) : brand(0.964, 0.017));
    set('code-inserted', o(0.976, 0.0377, 152));
    set('code-deleted', o(0.976, 0.0117, 26));
    set('code-inserted-mark', o(0.455, 0.1198, 152));
    set('code-deleted-mark', o(0.455, 0.1688, 26));
    set('code-line-number', ink(0.53));
    set('code-token-keyword', brand(0.455, 0.1837));
    set('code-token-string', o(0.455, 0.1198, 152));
    set('code-token-function', o(0.455, 0.1241, 48));
    set('code-token-constant', o(0.455, 0.0929, 232));
    set('code-token-parameter', o(0.375, 0.0845, 64.7));
    set('code-token-comment', ink(0.53));
    set('code-token-punctuation', ink(0.455));
    set('code-token-string-expression', o(0.455, 0.1198, 152));
    set('code-token-link', brand(0.455, 0.1837));
    return t;
  }

  const D = p.depth;
  const [s1, s2, s3, s4] = p.steps ?? [0.025, 0.05, 0.075, 0.11];
  const darkInk = p.solids.dark === 'dark';
  const text = p.text ?? 0.93;
  const selC = p.selectedChroma ?? 0.035;
  set('surface-canvas', n(D));
  set('surface-sunken', n(Math.max(0.1, D - 0.015)));
  set('surface', n(D + s1));
  set('surface-raised', n(D + s2));
  set('surface-overlay', n(D + s3));
  set('surface-hover', n(D + s4));
  set('surface-inset', n(D + s4 - 0.005));
  set('surface-selected', o(D + s4 + 0.025, selC, bh));
  set('surface-placeholder', n(D + s4 + 0.02));
  set('surface-placeholder-shine', n(D + s4 + 0.13));
  set('text', ink(text));
  set('text-muted', ink(text - 0.13));
  set('text-subtle', ink(text - 0.22));
  set('text-disabled', ink(0.56));
  set('border', n(D + s4 + 0.005));
  set('border-strong', ink(0.58));
  const solidInk = darkInk ? ink(0.19) : n(0.985, 0.6);
  // A light solid sits near its hue's cusp so it keeps its colour (a citron at 0.74 turns mustard),
  // held between 0.72 and 0.88 so dark ink always reads on it.
  const solidL = darkInk
    ? (p.accentL ?? Math.min(0.88, Math.max(0.74, cuspLightness(bh))))
    : Math.max(0.74, p.accentL ?? 0);
  if (darkInk) {
    set('accent', brand(solidL, 0.13));
    set('accent-hover', brand(solidL + 0.05, 0.12));
    set('accent-active', brand(solidL - 0.04, 0.13));
  } else {
    // Near-white ink on a mid solid, as in light mode; hover and press darken, as there.
    const midL = p.accentL ?? 0.56;
    set('accent', brand(midL, 0.17));
    set('accent-hover', brand(midL - 0.04, 0.16));
    set('accent-active', brand(midL - 0.08, 0.15));
  }
  set('accent-contrast', solidInk);
  set('accent-strong', brand(Math.max(0.8, solidL), 0.11));
  set('accent-subtle', o(D + s4 - 0.005, 0.065, bh));
  set('focus', brand(solidL, 0.13));
  const solid = {
    positive: [0.72, 0.14],
    negative: [0.7, 0.16],
    warning: [0.8, 0.15],
    info: [0.72, 0.11],
  };
  for (const [role, hue] of Object.entries(STATUS) as [keyof typeof STATUS, number][]) {
    const [l = 0.72, c = 0.14] = solid[role];
    const warn = role === 'warning';
    // Status solids carry dark ink in every dark style: their strong step is light text, and the
    // kit also sets status ink on it (a light solid under white ink cannot reach 4.5:1).
    set(role, o(l, c, hue));
    set(`${role}-subtle`, o(D + 0.08, 0.05, hue));
    set(`${role}-strong`, o(warn ? 0.86 : 0.83, warn ? 0.12 : 0.09, hue));
    set(`${role}-contrast`, ink(0.19));
  }
  set('negative-hover', o(0.76, 0.16, STATUS.negative));
  set('scrim', o(0.08, 0.005, nh, 0.6));
  // Series hold at least 0.1 of lightness apart, so they separate in greyscale and for every
  // colour vision type, not by hue alone.
  const series1 = solidL - 0.04;
  set('chart-series-1', brand(series1, 0.13));
  set('chart-series-2', o(series1 >= 0.8 ? series1 - 0.14 : series1 + 0.105, 0.14, 48));
  set('chart-series-3', ink(0.92));
  set('chart-sequence-1', brand(solidL - 0.02, 0.13));
  SEQUENCE.forEach(([h, , , l, c], i) => set(`chart-sequence-${String(i + 2)}`, o(l, c, h)));
  set('chart-grid', n(D + s4 - 0.01));
  set('chart-axis', ink(text - 0.22));
  set('chart-baseline', ink(0.55));
  set('chart-reference', ink(0.63));
  set('chart-tooltip', n(D + s3));
  set('chart-tooltip-border', n(D + s4 + 0.06));
  set('chart-halo', n(D + s1));
  IDENTITY_HUES(bh).forEach((h, i) => {
    set(`identity-${String(i + 1)}-subtle`, o(D + 0.12, 0.06, h));
    set(`identity-${String(i + 1)}-strong`, o(0.89, 0.06, h));
  });
  set('code-background', n(D + 0.04));
  set('code-foreground', ink(text));
  set('code-highlight', n(D + s4 - 0.01));
  set('code-inserted', o(D + 0.01, 0.045, 152));
  set('code-deleted', o(D + 0.01, 0.06, 26));
  set('code-inserted-mark', o(0.82, 0.09, 152));
  set('code-deleted-mark', o(0.82, 0.1, 26));
  set('code-line-number', ink(text - 0.22));
  set('code-token-keyword', brand(0.82, 0.09));
  set('code-token-string', o(0.82, 0.09, 152));
  set('code-token-function', o(0.82, 0.09, 48));
  set('code-token-constant', o(0.82, 0.075, 232));
  set('code-token-parameter', o(0.82, 0.13, 72));
  set('code-token-comment', ink(text - 0.22));
  set('code-token-punctuation', ink(0.82));
  set('code-token-string-expression', o(0.82, 0.09, 152));
  set('code-token-link', brand(0.82, 0.09));
  return t;
}

export function asStrings(t: TokenSet): Record<string, string> {
  return Object.fromEntries([...t].map(([k, v]) => [k, formatOklch(v)]));
}

/** Ink made for one fill: when the pair fails, the fill moves, not the ink. */
const INK = /^(accent|positive|negative|warning|info)-contrast$/;
/** Pairs whose background is the token meant to move (a selected or tint fill under fixed text). */
const MOVE_BG =
  /^(surface-selected|surface-hover|surface-inset|accent-subtle|(positive|negative|warning|info)-subtle|identity-\d-subtle|code-(highlight|inserted|deleted))$/;

export interface Correction {
  token: string;
  from: number;
  to: number;
  because: string;
}

/**
 * Moves lightness until every gated pair passes. Text and marks move away from their background
 * (lighter in dark mode, darker in light); ink on a solid stays and the solid moves; a tint under
 * fixed text moves toward the canvas. Chroma is refitted to sRGB at each step.
 */
export function correct(t: TokenSet, mode: Mode, pairs: Pair[], limit = 400): Correction[] {
  const log: Correction[] = [];
  const start = new Map([...t].map(([k, v]) => [k, v.l]));
  const away = mode === 'dark' ? 1 : -1;
  for (let round = 0; round < limit; round += 1) {
    const fails = evaluate(asStrings(t), pairs).filter((r) => !r.pass);
    if (fails.length === 0) break;
    const moved = new Set<string>();
    for (const f of fails) {
      let name: string;
      let dir: number;
      if (INK.test(f.fg)) {
        name = f.bg;
        const fill = t.get(`--rx-${f.bg}`);
        const inkL = t.get(`--rx-${f.fg}`)?.l ?? 0;
        dir = (fill?.l ?? 0) > inkL ? 1 : -1;
      } else if (MOVE_BG.test(f.bg) && !MOVE_BG.test(f.fg)) {
        name = f.bg;
        dir = -away;
      } else {
        name = f.fg;
        const fgL = t.get(`--rx-${f.fg}`)?.l ?? 0;
        const bgL = t.get(`--rx-${f.bg}`)?.l ?? 0;
        dir = fgL >= bgL ? 1 : -1;
      }
      if (moved.has(name)) continue;
      const key = `--rx-${name}`;
      const c = t.get(key);
      if (c === undefined) continue;
      moved.add(name);
      t.set(key, fitSrgb({ ...c, l: Math.min(0.99, Math.max(0.05, c.l + dir * 0.005)) }));
      const prior = log.find((l) => l.token === name);
      if (prior === undefined)
        log.push({
          token: name,
          from: start.get(key) ?? c.l,
          to: c.l,
          because: `${f.fg} on ${f.bg}`,
        });
    }
  }
  for (const entry of log) entry.to = t.get(`--rx-${entry.token}`)?.l ?? entry.to;
  return log;
}

/** The dark directions proposed for the default theme. */
export const PRESETS: Preset[] = [
  {
    name: 'graphite',
    label: 'Graphite',
    brand: { hue: 263, chroma: 0.19 },
    neutral: { hue: 75, chroma: 0.006 },
    depth: 0.175,
    steps: [0.025, 0.05, 0.075, 0.085],
    text: 0.93,
    solids: { light: 'light', dark: 'light' },
    accentL: 0.545,
    selectedChroma: 0.045,
  },
  {
    name: 'ink',
    label: 'Ink',
    brand: { hue: 263, chroma: 0.19 },
    neutral: { hue: 255, chroma: 0.011 },
    ink: { hue: 255, chroma: 0.007 },
    depth: 0.19,
    steps: [0.03, 0.055, 0.085, 0.12],
    text: 0.94,
    solids: { light: 'light', dark: 'dark' },
    selectedChroma: 0.05,
  },
  {
    name: 'onyx',
    label: 'Onyx',
    brand: { hue: 263, chroma: 0.19 },
    neutral: { hue: 75, chroma: 0.003 },
    depth: 0.13,
    steps: [0.035, 0.07, 0.105, 0.14],
    text: 0.95,
    solids: { light: 'light', dark: 'dark' },
    accentL: 0.68,
    selectedChroma: 0.045,
  },
];

/** The ledger look, rebuilt from inputs: olive paper, green-black ink, a citron accent. */
export const LEDGER_LOOK: Preset = {
  name: 'ledger-look',
  label: 'Ledger look',
  brand: { hue: 108, chroma: 0.16 },
  neutral: { hue: 112, chroma: 0.0075 },
  ink: { hue: 172, chroma: 0.011 },
  depth: 0.155,
  text: 0.95,
  solids: { light: 'ink', dark: 'dark' },
  selectedChroma: 0.05,
};

type Json = Record<string, unknown>;

/** Writes one dark proposal as DTCG, shaped exactly like themes/default/dark.json. */
function toDtcg(p: Preset, t: TokenSet, log: Correction[]): Json {
  const template = JSON.parse(
    readFileSync(join(here, '..', 'src', 'themes', 'default', 'dark.json'), 'utf8'),
  ) as Json;
  const walk = (node: Json, path: string[], type: string | undefined): Json => {
    const out: Json = {};
    const ownType = typeof node.$type === 'string' ? node.$type : type;
    for (const [key, value] of Object.entries(node)) {
      if (key === '$value') {
        if (ownType === 'color') {
          const name = cssVarName(path);
          const c = t.get(name);
          if (c === undefined) throw new Error(`${p.name}: no derived value for ${name}`);
          out.$value = {
            colorSpace: 'oklch',
            components: [Number(c.l.toFixed(4)), Number(c.c.toFixed(4)), Number(c.h.toFixed(2))],
            ...(c.alpha !== undefined && c.alpha < 1 ? { alpha: c.alpha } : {}),
          };
        } else if (ownType === 'shadow') {
          out.$value = shadowFor(p, path.at(-1) ?? 'raised', value);
        } else out.$value = value;
      } else if (key.startsWith('$')) out[key] = value;
      else if (typeof value === 'object' && value !== null)
        out[key] = walk(value as Json, [...path, key], ownType);
    }
    return out;
  };
  const body = walk(template, [], undefined);
  const notes = log.map(
    (l) => `${l.token} ${l.from.toFixed(3)} to ${l.to.toFixed(3)} (${l.because})`,
  );
  return {
    $description: `Dark proposal "${p.label}" for the default theme. Generated by scripts/derive.ts from the preset inputs: brand hue ${String(p.brand.hue)}, neutral hue ${String(p.neutral.hue)} at chroma ${String(p.neutral.chroma)}, depth ${String(p.depth)}. Opt in with data-dark-proposal="${p.name}" on <html>. Corrections: ${notes.length > 0 ? notes.join('; ') : 'none'}.`,
    ...body,
  };
}

function shadowFor(p: Preset, which: string, original: unknown): unknown {
  if (!Array.isArray(original)) return original;
  const deep = p.depth < 0.15;
  return original.map((layer: Json, i: number) => {
    const color = layer.color as { components: number[]; alpha?: number };
    const [l = 0.1] = color.components;
    const highlight = l > 0.5;
    return {
      ...layer,
      color: {
        colorSpace: 'oklch',
        components: [l, highlight ? 0.01 : 0.01, p.neutral.hue],
        alpha: highlight
          ? deep
            ? 0.09
            : 0.07
          : (color.alpha ?? 0.4) * (deep && which === 'overlay' && i === 1 ? 1.1 : 1),
      },
    };
  });
}

export function build(p: Preset, mode: Mode, pairs = derivePairs()) {
  const tokens = derive(p, mode);
  const log = correct(tokens, mode, pairs);
  const fails = evaluate(asStrings(tokens), pairs).filter((r) => !r.pass);
  return { tokens, log, fails };
}

function main() {
  const pairs = derivePairs();
  const dir = join(here, '..', 'src', 'proposals', 'default');
  mkdirSync(dir, { recursive: true });
  for (const p of PRESETS) {
    const { tokens, log, fails } = build(p, 'dark', pairs);
    if (fails.length > 0)
      throw new Error(
        `${p.name}: ${fails.map((f) => `${f.fg} on ${f.bg} ${f.ratio.toFixed(2)}`).join(', ')}`,
      );
    // Number arrays on one line, as the formatter keeps them.
    const json = JSON.stringify(toDtcg(p, tokens, log), null, 2).replace(
      /\[\s+([-\d.,\s]+?)\s+\]/g,
      (_: string, inner: string) => `[${inner.split(/,\s*/).join(', ')}]`,
    );
    writeFileSync(join(dir, `${p.name}.json`), `${json}\n`);
    console.log(`${p.name}: ${String(tokens.size)} colours, ${String(log.length)} corrected`);
    for (const l of log)
      console.log(`  ${l.token} ${l.from.toFixed(3)} -> ${l.to.toFixed(3)} (${l.because})`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
