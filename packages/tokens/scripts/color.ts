/** OKLCH colour math for the token build: gamut checks and WCAG contrast. */

export interface Oklch {
  /** Lightness, 0 to 1. */
  l: number;
  /** Chroma, 0 to about 0.37. */
  c: number;
  /** Hue in degrees. */
  h: number;
  /** Alpha, 0 to 1. */
  alpha?: number;
}

export type Rgb = readonly [number, number, number];

/** OKLCH to linear-light sRGB (unclamped, so out-of-gamut channels fall outside 0..1). */
export function oklchToLinearSrgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const EPSILON = 1e-4;

export function inSrgbGamut(color: Oklch): boolean {
  return oklchToLinearSrgb(color).every((v) => v >= -EPSILON && v <= 1 + EPSILON);
}

/** Lowers chroma until the colour fits sRGB, keeping lightness and hue. */
export function fitSrgb(color: Oklch): Oklch {
  if (inSrgbGamut(color)) return color;
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (inSrgbGamut({ ...color, c: mid })) lo = mid;
    else hi = mid;
  }
  return { ...color, c: lo };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** WCAG relative luminance of an opaque colour. */
export function luminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearSrgb(color).map(clamp01) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Composites a translucent colour over an opaque backdrop, in linear light. */
export function compositeLuminance(top: Oklch, backdrop: Oklch): number {
  const alpha = top.alpha ?? 1;
  return alpha * luminance(top) + (1 - alpha) * luminance(backdrop);
}

export function contrastRatio(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export function contrast(fg: Oklch, bg: Oklch): number {
  return contrastRatio(compositeLuminance(fg, bg), luminance(bg));
}

const round = (v: number, digits: number) => Number(v.toFixed(digits));

export function formatOklch({ l, c, h, alpha = 1 }: Oklch): string {
  const base = `oklch(${round(l * 100, 2)}% ${round(c, 4)} ${round(h, 2)}`;
  return alpha < 1 ? `${base} / ${round(alpha, 3)})` : `${base})`;
}
