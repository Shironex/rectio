/**
 * Contrast math for one resolved token set: OKLCH parsing, WCAG 2.2 ratios and APCA Lc. Pure, so
 * the theme generator runs it in the browser and in the CLI; scripts/contrast.ts finds the pairs.
 */
import { contrast, oklchToLinearSrgb, type Oklch } from './color.ts';

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
