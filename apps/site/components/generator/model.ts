/**
 * The generator page's model: the presets, the mapping from guided controls to theme inputs, and
 * the small helpers the controls share. Everything colour-related comes from @rectio/tokens.
 */
import {
  DEFAULT_NAME,
  DEFAULT_STEPS,
  RANGES,
  cuspLightness,
  encodeTheme,
  expandPairs,
  fitSrgb,
  generatorPresets,
  parseOklch,
  toHex,
  type GeneratorData,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import generatorData from '@rectio/tokens/generator.json';
import type { CSSProperties } from 'react';

export const DATA = generatorData as unknown as GeneratorData;
export const PAIRS = expandPairs(DATA.pairs);
export const PRESETS = generatorPresets(DATA.presets);
/** The data-theme id the preview's scoped CSS is written for. */
export const PREVIEW_ID = 'generator-preview';
/** Where the browser remembers the last theme, a convenience only: the URL is the state. */
export const STORAGE_KEY = 'rectio-theme-generator';

const first = PRESETS[0];
if (first === undefined) throw new Error('the generator data carries no presets');
export const DEFAULT_PRESET = first;

export const presetById = (id: string) => PRESETS.find((p) => p.id === id);

export const fresh = (inputs: ThemeInputs): ThemeInputs => structuredClone(inputs);

/** The preset these inputs still match, colours, shape and type alike; overrides do not count. */
export function matchingPreset(inputs: ThemeInputs): string | undefined {
  // Compared through the theme code, which drops defaults and fixes the key order, so inputs read
  // back from a link or the stored copy still match the preset they came from.
  const strip = (i: ThemeInputs) =>
    encodeTheme({ ...i, name: DEFAULT_NAME, overrides: { light: {}, dark: {} } });
  const key = strip(inputs);
  return PRESETS.find((p) => strip(p.inputs) === key)?.id;
}

/* Neutral temperature: one slider from warm through grey to cool. */

const WARM_HUE = 70;
const COOL_HUE = 250;
const MAX_TINT = RANGES.neutralChroma[1];
const isWarm = (hue: number) => hue < 160 || hue >= 340;

/** -100 (warmest) to 100 (coolest); 0 is a plain grey. */
export function temperatureOf(neutral: { hue: number; chroma: number }): number {
  const strength = Math.round((neutral.chroma / MAX_TINT) * 100);
  if (strength === 0) return 0;
  return isWarm(neutral.hue) ? -strength : strength;
}

/** The neutral for a temperature, keeping the current hue while it stays on the same side. */
export function neutralFor(
  value: number,
  current: { hue: number; chroma: number },
): { hue: number; chroma: number } {
  const chroma = Number(((Math.abs(value) / 100) * MAX_TINT).toFixed(4));
  const warm = value < 0;
  const sameSide = current.chroma > 0 && isWarm(current.hue) === warm;
  return { hue: sameSide ? current.hue : warm ? WARM_HUE : COOL_HUE, chroma };
}

export function temperatureLabel(value: number): string {
  if (value === 0) return 'Neutral grey';
  const strength =
    Math.abs(value) < 34 ? 'Slightly' : Math.abs(value) < 67 ? 'Clearly' : 'Strongly';
  return `${strength} ${value < 0 ? 'warm' : 'cool'}`;
}

/* Layer contrast: the four dark surface steps, scaled together. */

const LAST_STEP = DEFAULT_STEPS[3];

export function layerScale(steps: readonly number[] | undefined): number {
  return Number(((steps?.[3] ?? LAST_STEP) / LAST_STEP).toFixed(2));
}

export function stepsFor(scale: number): [number, number, number, number] {
  const [a, b, c, d] = DEFAULT_STEPS.map((s) =>
    Math.min(RANGES.step[1], Number((s * scale).toFixed(4))),
  );
  return [a ?? 0, b ?? 0, c ?? 0, d ?? 0];
}

/**
 * A preset's tuned hairline is a lightness, not a step above the surfaces: when the dark depth or
 * the layer steps move, it moves by the same amount, so the border keeps its place among them.
 */
export function moveBorder(color: ThemeInputs['color'], delta: number): void {
  if (color.borderL === undefined) return;
  color.borderL = Number(clamp(color.borderL + delta, RANGES.borderL).toFixed(4));
}

/**
 * The brand as the picker shows it: the light accent fill, or with the ink style (where the fill is
 * ink), the brand at its hue's most vivid lightness, as it appears as text on that ink.
 */
export function brandHex(inputs: ThemeInputs, lightTokens: Record<string, string>): string {
  if (inputs.color.solids.light !== 'ink') return hexOf(lightTokens, '--rx-accent');
  const { hue, chroma } = inputs.color.brand;
  return toHex(fitSrgb({ l: cuspLightness(hue), c: chroma, h: hue }));
}

/** A token of a resolved mode as hex, for the colour picker. */
export function hexOf(tokens: Record<string, string>, name: string): string {
  const color = parseOklch(tokens[name]);
  return color === undefined ? '' : toHex(color);
}

export const clamp = (value: number, [min, max]: readonly [number, number]) =>
  Math.min(max, Math.max(min, value));

export const percent = (value: number) => `${String(Math.round(value * 100))}%`;

/**
 * A colour shown as itself (a swatch of a generated value), through the --rx-swatch property so
 * the class reads a token-shaped variable: `bg-(--rx-swatch)`.
 */
export const swatch = (value: string | undefined) =>
  ({ '--rx-swatch': value ?? 'transparent' }) as CSSProperties;
