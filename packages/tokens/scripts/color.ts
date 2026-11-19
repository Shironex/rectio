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

/** A colour vision deficiency, simulated at full severity. */
export type ColorVision = 'protan' | 'deutan' | 'tritan';

/**
 * Machado, Oliveira and Fernandes (2009) matrices at severity 1.0, applied in linear sRGB: what a
 * person with no L, M or S cones sees.
 */
const CVD: Record<ColorVision, readonly (readonly [number, number, number])[]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** Linear sRGB to OKLab [L, a, b]. */
function linearSrgbToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** The colour as OKLab, optionally as seen with a colour vision deficiency. */
function seenAs(color: Oklch, vision?: ColorVision): Rgb {
  const rgb = oklchToLinearSrgb(color).map(clamp01) as unknown as Rgb;
  if (vision === undefined) return linearSrgbToOklab(rgb);
  const seen = CVD[vision].map((row) =>
    Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]),
  ) as unknown as Rgb;
  return linearSrgbToOklab(seen);
}

/**
 * Euclidean distance in OKLab (deltaE OK), optionally after simulating a colour vision deficiency.
 * About 0.02 is a just noticeable difference; chart marks that sit side by side want far more.
 */
export function difference(a: Oklch, b: Oklch, vision?: ColorVision): number {
  const [l1, a1, b1] = seenAs(a, vision);
  const [l2, a2, b2] = seenAs(b, vision);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}
