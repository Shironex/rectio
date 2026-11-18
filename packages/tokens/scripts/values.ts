/** DTCG 2025.10 token values to CSS. */
import { formatOklch } from './color.ts';

interface DtcgDimension {
  value: number;
  unit: string;
}

interface DtcgColor {
  colorSpace: string;
  components: [number, number, number];
  alpha?: number;
}

interface DtcgShadow {
  color: unknown;
  offsetX: unknown;
  offsetY: unknown;
  blur: unknown;
  spread: unknown;
  inset?: boolean;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function color(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!isObject(value) || value.colorSpace !== 'oklch') {
    throw new Error(`only oklch colours are supported, got ${JSON.stringify(value)}`);
  }
  const [l, c, h] = (value as unknown as DtcgColor).components;
  return formatOklch({ l, c, h, alpha: (value as unknown as DtcgColor).alpha ?? 1 });
}

function dimension(value: unknown): string {
  if (typeof value === 'string') return value;
  const { value: amount, unit } = value as DtcgDimension;
  return `${amount}${unit}`;
}

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
]);

function fontFamily(value: unknown): string {
  const names = Array.isArray(value) ? (value as string[]) : [String(value)];
  if (names.length === 1 && names[0]?.includes(',')) return names[0];
  return names.map((name) => (GENERIC_FAMILIES.has(name) ? name : `"${name}"`)).join(', ');
}

function shadow(value: unknown): string {
  if (typeof value === 'string') return value;
  const layers = (Array.isArray(value) ? value : [value]) as DtcgShadow[];
  return layers
    .map((s) =>
      [
        s.inset === true ? 'inset' : '',
        dimension(s.offsetX),
        dimension(s.offsetY),
        dimension(s.blur),
        dimension(s.spread),
        color(s.color),
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(', ');
}

export function cssValue(value: unknown, type: string | undefined): string {
  switch (type) {
    case 'color':
      return color(value);
    case 'dimension':
    case 'duration':
      return dimension(value);
    case 'cubicBezier':
      return typeof value === 'string' ? value : `cubic-bezier(${(value as number[]).join(', ')})`;
    case 'fontFamily':
      return fontFamily(value);
    case 'fontWeight':
    case 'number':
      return String(value);
    case 'shadow':
      return shadow(value);
    default:
      throw new Error(`unsupported token type ${String(type)}`);
  }
}
