/**
 * The pure half of the theme derivation: inputs to every colour role in OKLCH, and the correction
 * loop that moves lightness until every gated pair passes. No Node APIs, so the theme generator runs
 * it in the browser and the CLI bundles it; scripts/derive.ts adds the presets and the file output.
 */
import { fitSrgb, formatOklch, type Oklch } from './color.ts';
import { evaluate, type Pair } from './evaluate.ts';

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
  /** Lightness of the selected fill above hover in dark mode; defaults to 0.025. */
  selectedStep?: number;
  /**
   * Chroma of the accent tint (accent-subtle) in dark mode: unread rows, a highlighted option, a
   * drop target. Defaults to 0.065; lower reads warmer on a warm neutral.
   */
  subtleChroma?: number;
  /** Dark: the lightness of the hairline border (default: the hover step plus 0.005). */
  borderL?: number;
  /** Dark: the lightness of the first chart series (default: the solid's lightness less 0.04). */
  seriesL?: number;
  /** Dark: the chroma of the first two chart series (default 0.13 and 0.14). */
  seriesChroma?: number;
  /** Dark, white ink: hover keeps the solid's lightness and only gains chroma (default: 0.01 darker). */
  flatHover?: boolean;
  /** Dark: the lightness and chroma of the strong accent, the accent as text (default 0.8 and 0.11). */
  strong?: [l: number, c: number];
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
    // The warning fill is light, for dark ink on it; a mark drawn on a surface (a rating star) needs
    // a deeper amber, turned toward yellow at the edge of sRGB so it reads as gold, not the brown of the
    // strong step.
    set('warning-mark', o(0.635, 0.1329, 77));
    set('negative-hover', o(0.455, 0.1688, STATUS.negative));
    set('scrim', o(0.18, 0.008, nh, 0.36));
    // Read only when a skin turns them on: the light rim along the top of a translucent surface,
    // and the hard offset shadow, drawn in ink so a focus ring stays clear of it.
    set('border-highlight', o(0.995, 0, nh, 0.72));
    set('shadow-offset-color', ink(0.21));
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
  set('surface-selected', o(D + s4 + (p.selectedStep ?? 0.025), selC, bh));
  // A skeleton reads as a shape on raised surfaces too, about as far off them as in light mode.
  set('surface-placeholder', n(D + s4 + 0.05));
  set('surface-placeholder-shine', n(D + s4 + 0.15));
  set('text', ink(text));
  set('text-muted', ink(text - 0.13));
  set('text-subtle', ink(text - 0.22));
  set('text-disabled', ink(0.56));
  set('border', n(p.borderL ?? D + s4 + 0.005));
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
    // Near-white ink on a mid solid, as in light mode; hover and press darken, as there. Hover only
    // a little, with more chroma: the kit draws it as a mark too (a switch thumb track on an
    // overlay), which must keep 3:1 against the lifted overlay.
    const midL = p.accentL ?? 0.56;
    set('accent', brand(midL, 0.17));
    set('accent-hover', brand(p.flatHover === true ? midL : midL - 0.01, 0.18));
    set('accent-active', brand(midL - 0.08, 0.15));
  }
  set('accent-contrast', solidInk);
  set('accent-strong', p.strong ? brand(...p.strong) : brand(Math.max(0.8, solidL), 0.11));
  set('accent-subtle', o(D + s4 - 0.005, p.subtleChroma ?? 0.065, bh));
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
  set('warning-mark', o(solid.warning[0] ?? 0.8, solid.warning[1] ?? 0.15, STATUS.warning));
  set('negative-hover', o(0.76, 0.16, STATUS.negative));
  set('scrim', o(0.08, 0.005, nh, 0.64));
  // A faint rim of light on dark glass; the offset shadow sits between the canvas and a focus ring
  // in lightness, so both the shadow and the ring read.
  set('border-highlight', o(0.985, 0.006, nh, 0.22));
  set('shadow-offset-color', ink(0.45));
  // Series hold at least 0.1 of lightness apart, so they separate in greyscale and for every
  // colour vision type, not by hue alone.
  const series1 = p.seriesL ?? solidL - 0.04;
  set('chart-series-1', brand(series1, p.seriesChroma ?? 0.13));
  set(
    'chart-series-2',
    o(series1 >= 0.8 ? series1 - 0.14 : series1 + 0.105, p.seriesChroma ?? 0.14, 48),
  );
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
    set(`identity-${String(i + 1)}-subtle`, o(D + 0.15, 0.07, h));
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
