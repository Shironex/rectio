/**
 * Inputs to finished colours, per mode: derive (or take the shipped colours), correct until every
 * gated pair passes WCAG 2.2 AA, then lay the user's overrides on top and check them. Overrides are
 * never corrected: a failing override is reported so the page can warn, and kept.
 */
import { parseOklch } from '../scripts/evaluate.ts';
import {
  asStrings,
  correct,
  derive,
  type Correction,
  type Mode,
  type TokenSet,
} from '../scripts/derive-core.ts';
import { evaluate, type Gate, type Pair, type Result } from '../scripts/evaluate.ts';
import type { Preset } from '../scripts/derive-core.ts';
import type { ThemeInputs } from './inputs.ts';

/** One gated pair as stored in generator.json: fg, fg alpha, bg, bg alpha, minimum ratio, gate. */
export type PackedPair = [string, number, string, number, number, 't' | 'u'];

/** dist/generator.json: what the token build hands the page and the CLI. */
export interface GeneratorData {
  version: 1;
  /** The derivation presets from scripts/derive.ts, as they were at build time. */
  presets: Preset[];
  /** Every gated colour pair the kit draws (scripts/contrast.ts), deduplicated. */
  pairs: PackedPair[];
  /** Compact density values (`--rx-space-unit` and control sizes), for a compact-first theme. */
  compact: Record<string, string>;
}

export function expandPairs(packed: readonly PackedPair[]): Pair[] {
  return packed.map(([fg, fgAlpha, bg, bgAlpha, min, gate]) => ({
    fg,
    fgAlpha,
    bg,
    bgAlpha,
    min,
    gate: (gate === 't' ? 'text' : 'ui') satisfies Gate,
    source: 'exact',
    where: [],
  }));
}

export interface ModeResult {
  /** Every colour token (`--rx-*`) to its final OKLCH string, overrides included. */
  tokens: Record<string, string>;
  /** Moves the correction made, before overrides. */
  corrections: Correction[];
  /** Larger adjustments than a lightness move, such as a switch of ink style. */
  notes: string[];
  /** Every gated pair checked against the final tokens. */
  results: Result[];
  /** Gated pairs that fail, each once per foreground and background. */
  fails: Result[];
  /** Overrides that apply in this mode, by token name without the prefix. */
  overridden: string[];
}

export interface ResolvedTheme {
  light: ModeResult;
  dark: ModeResult;
}

/** Shipped colours by mode, from the default theme CSS (see templateColors). Only light is read. */
export type ShippedColors = Record<Mode, Record<string, string>>;

/** The colour role names, in derivation order: the set every theme fills. */
export function colorRoles(): string[] {
  return [
    ...derive(
      {
        name: 'roles',
        label: 'roles',
        brand: { hue: 263, chroma: 0.19 },
        neutral: { hue: 75, chroma: 0.006 },
        depth: 0.175,
        solids: { light: 'light', dark: 'light' },
      },
      'light',
    ).keys(),
  ];
}

function shippedSet(values: Record<string, string>, roles: readonly string[]): TokenSet {
  const set: TokenSet = new Map();
  for (const name of roles) {
    const c = parseOklch(values[name]);
    if (c !== undefined) set.set(name, c);
  }
  return set;
}

/** One result per foreground and background: the worst one, measured against its own minimum. */
function unique(results: Result[]): Result[] {
  const worst = new Map<string, Result>();
  for (const r of results) {
    const key = `${r.fg}|${r.bg}`;
    const prior = worst.get(key);
    if (prior === undefined || r.ratio / r.min < prior.ratio / prior.min) worst.set(key, r);
  }
  return [...worst.values()];
}

/** Derives (or takes the shipped light), then corrects, and says whether anything still fails. */
function corrected(inputs: ThemeInputs, mode: Mode, pairs: Pair[], shipped: ShippedColors) {
  const derived = derive({ name: inputs.name, label: inputs.name, ...inputs.color }, mode);
  // Default keeps the shipped light colours; its dark is derived from the Graphite inputs, as the
  // shipped default dark is.
  const set =
    inputs.base === 'default' && mode === 'light'
      ? shippedSet(shipped.light, [...derived.keys()])
      : derived;
  // A shipped set missing a role (an older template) falls back to the derived value.
  for (const [name, value] of derived) if (!set.has(name)) set.set(name, value);
  const corrections = correct(set, mode, pairs);
  const tokens = asStrings(set);
  return { tokens, corrections, failing: evaluate(tokens, pairs).some((r) => !r.pass) };
}

type Color = ThemeInputs['color'];

/**
 * When moving lightness cannot satisfy every pair, the ink style changes. A mid solid under white
 * ink can be squeezed between 3:1 against bright dark surfaces and 4.5:1 under its ink; a dark ink
 * on a light solid always resolves. The switch is reported as a note.
 */
const FALLBACK: Record<Mode, { when: string; patch: (c: Color) => Color; note: string }> = {
  dark: {
    when: 'light',
    patch: (c) => {
      const next: Color = { ...c, solids: { ...c.solids, dark: 'dark' } };
      // The dark-ink solid sits at its hue's cusp, not at a lightness picked for white ink.
      delete next.accentL;
      return next;
    },
    note: 'Accent solids switched to dark ink: white ink could not reach 4.5:1 on these surfaces.',
  },
  light: {
    when: 'ink',
    patch: (c) => ({ ...c, solids: { ...c.solids, light: 'light' } }),
    note: 'Accent solids switched to white ink: the ink style could not pass on these surfaces.',
  },
};

function resolveMode(
  inputs: ThemeInputs,
  mode: Mode,
  pairs: Pair[],
  shipped: ShippedColors,
): ModeResult {
  let chosen = corrected(inputs, mode, pairs, shipped);
  const notes: string[] = [];
  const fallback = FALLBACK[mode];
  if (chosen.failing && inputs.color.solids[mode] === fallback.when) {
    const retry = corrected(
      { ...inputs, color: fallback.patch(inputs.color) },
      mode,
      pairs,
      shipped,
    );
    if (!retry.failing) {
      chosen = retry;
      notes.push(fallback.note);
    }
  }
  const { tokens, corrections } = chosen;
  const overrides = inputs.overrides[mode];
  const overridden: string[] = [];
  for (const [name, value] of Object.entries(overrides)) {
    const key = `--rx-${name}`;
    if (!(key in tokens) || parseOklch(value) === undefined) continue;
    tokens[key] = value;
    overridden.push(name);
  }
  const results = evaluate(tokens, pairs);
  return {
    tokens,
    corrections,
    notes,
    results,
    fails: unique(results.filter((r) => !r.pass)),
    overridden,
  };
}

export function resolveTheme(
  inputs: ThemeInputs,
  pairs: Pair[],
  shipped: ShippedColors,
): ResolvedTheme {
  return {
    light: resolveMode(inputs, 'light', pairs, shipped),
    dark: resolveMode(inputs, 'dark', pairs, shipped),
  };
}

/** Distinct gated pairs (by foreground and background) and how many pass. */
export function passCount(result: ModeResult): { pass: number; total: number } {
  const all = new Map<string, boolean>();
  for (const r of result.results) {
    const key = `${r.fg}|${r.bg}`;
    all.set(key, (all.get(key) ?? true) && r.pass);
  }
  return { pass: [...all.values()].filter(Boolean).length, total: all.size };
}

/** The pairs a token takes part in, with their numbers in this mode: the advanced panel's warnings. */
export function pairsOf(result: ModeResult, token: string): Result[] {
  return unique(result.results.filter((r) => r.fg === token || r.bg === token));
}
