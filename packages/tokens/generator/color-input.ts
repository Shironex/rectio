/**
 * Colours typed into the theme generator: a hex value (`#2f6bd8`, `#36d`) or an OKLCH value
 * (`oklch(53% 0.19 263)`, `oklch(0.53 0.19 263 / 0.5)`), read into OKLCH and fitted to sRGB.
 */
import { fitSrgb, type Oklch } from '../scripts/color.ts';

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const OKLCH =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/i;

const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** A gamma-encoded sRGB colour (channels 0 to 1) in OKLCH. */
export function fromSrgb([r, g, b]: readonly [number, number, number]): Oklch {
  const [lr, lg, lb] = [decode(r), decode(g), decode(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

/** What a person typed, as OKLCH inside sRGB, or undefined when it is not a colour. */
export function parseColor(text: string): Oklch | undefined {
  const value = text.trim();
  const hex = HEX.exec(value);
  if (hex !== null) {
    const digits = hex[1] ?? '';
    const full =
      digits.length === 3
        ? digits
            .split('')
            .map((d) => d + d)
            .join('')
        : digits;
    const channel = (i: number) => parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255;
    return fromSrgb([channel(0), channel(1), channel(2)]);
  }
  const m = OKLCH.exec(value);
  if (m === null) return undefined;
  const l = Number(m[1]) / (m[2] === '%' ? 100 : 1);
  const c = Number(m[3]);
  const h = Number(m[4]) % 360;
  const alpha = m[5] === undefined ? 1 : Number(m[5]) / (m[6] === '%' ? 100 : 1);
  if (![l, c, h, alpha].every(Number.isFinite) || l > 1 || alpha > 1) return undefined;
  const color = fitSrgb({ l, c, h });
  return alpha < 1 ? { ...color, alpha } : color;
}
