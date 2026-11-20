/**
 * Theme derivation: a handful of inputs (brand hue and chroma, neutral hue and chroma, dark surface
 * depth, how ink sits on solid fills) to every colour token, in OKLCH, then corrected until every
 * pair from scripts/contrast.ts passes WCAG 2.2 AA.
 *
 *   node scripts/derive.ts    writes the default theme's dark mode (src/themes/default/dark.json)
 *                             from the Graphite preset
 *
 * The same functions back the theme generator: derive(), then correct() against derivePairs().
 * The other presets (ink, onyx, the ledger look) are starting points for it, not shipped themes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { derivePairs, evaluate } from './contrast.ts';
import {
  asStrings,
  correct,
  derive,
  type Correction,
  type Mode,
  type Preset,
  type TokenSet,
} from './derive-core.ts';
import { cssVarName } from './naming.ts';

export { asStrings, correct, cuspLightness, derive } from './derive-core.ts';
export type { Correction, Mode, Preset, TokenSet } from './derive-core.ts';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The default theme's dark mode. Warm graphite: the light theme's stone neutrals carried into dark,
 * cobalt kept as a mid solid under near-white ink, as in light. Tuned after review: the overlay tier
 * sits a full step above raised so popovers, menus and toasts float; hover sits above it; the accent
 * tint is low in chroma so unread rows and highlighted options do not turn cool on warm surfaces;
 * the solid is a touch lighter so marks hold 3:1 on the lifted fills while white ink keeps 4.5:1.
 */
export const GRAPHITE: Preset = {
  name: 'graphite',
  label: 'Graphite',
  brand: { hue: 263, chroma: 0.19 },
  neutral: { hue: 75, chroma: 0.006 },
  depth: 0.17,
  steps: [0.045, 0.065, 0.095, 0.105],
  text: 0.93,
  solids: { light: 'light', dark: 'light' },
  accentL: 0.56,
  selectedChroma: 0.035,
  selectedStep: 0.005,
  subtleChroma: 0.022,
  borderL: 0.305,
  seriesL: 0.62,
  seriesChroma: 0.145,
  flatHover: true,
  strong: [0.77, 0.13],
};

/** Starting points for the theme generator: the default (Graphite), a cool dark and a near black. */
export const PRESETS: Preset[] = [
  GRAPHITE,
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

const DARK_JSON = join(here, '..', 'src', 'themes', 'default', 'dark.json');

/**
 * One derived dark mode as DTCG, shaped exactly like themes/default/dark.json (that file is the
 * template: its groups, descriptions and non-colour values are kept, its colours replaced).
 */
export function toDtcg(p: Preset, t: TokenSet, log: Correction[] = []): Json {
  const template = JSON.parse(readFileSync(DARK_JSON, 'utf8')) as Json;
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
      } else if (key.startsWith('$')) {
        if (path.length > 0 || key !== '$description') out[key] = value;
      } else if (typeof value === 'object' && value !== null)
        out[key] = walk(value as Json, [...path, key], ownType);
    }
    return out;
  };
  const body = walk(template, [], undefined);
  const notes = log.map(
    (l) => `${l.token} ${l.from.toFixed(3)} to ${l.to.toFixed(3)} (${l.because})`,
  );
  return {
    $description: `Dark mode of the default theme, preset "${p.label}". Generated by scripts/derive.ts (node scripts/derive.ts): edit the preset there, not this file. Contrast corrections: ${notes.length > 0 ? notes.join('; ') : 'none'}.`,
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
  const { tokens, log, fails } = build(GRAPHITE, 'dark');
  if (fails.length > 0)
    throw new Error(
      `${GRAPHITE.name}: ${fails.map((f) => `${f.fg} on ${f.bg} ${f.ratio.toFixed(2)}`).join(', ')}`,
    );
  // Number arrays on one line, as the formatter keeps them.
  const json = JSON.stringify(toDtcg(GRAPHITE, tokens, log), null, 2).replace(
    /\[\s+([-\d.,\s]+?)\s+\]/g,
    (_: string, inner: string) => `[${inner.split(/,\s*/).join(', ')}]`,
  );
  writeFileSync(DARK_JSON, `${json}\n`);
  console.log(`default/dark: ${String(tokens.size)} colours, ${String(log.length)} corrected`);
  for (const l of log)
    console.log(`  ${l.token} ${l.from.toFixed(3)} -> ${l.to.toFixed(3)} (${l.because})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
