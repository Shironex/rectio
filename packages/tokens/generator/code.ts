/**
 * The theme code: a generated theme as one URL-safe string, `1.<base64url JSON>`. The number before
 * the dot is the format version; a reader refuses a version it does not know rather than guess. The
 * JSON uses one-letter keys and leaves out every value equal to its default, so a guided theme stays
 * around 200 characters. The share link carries it as `?theme=<code>`, and `rectio add <link>`
 * decodes it locally: nothing is fetched from the link.
 */
import {
  DEFAULT_FONTS,
  DEFAULT_NAME,
  DEFAULT_SELECTED_CHROMA,
  DEFAULT_STEPS,
  DEFAULT_TEXT,
  FONTS,
  RADII,
  RANGES,
  slugName,
  type FontRole,
  type Overrides,
  type ThemeInputs,
} from './inputs.ts';

export const CODE_VERSION = 1;
/** The query parameter of the share link. */
export const CODE_PARAM = 'theme';

const ROLES: FontRole[] = ['sans', 'display', 'mono', 'numeric'];
const OVERRIDE = /^(?:[a-z0-9]+-)*[a-z0-9]+$/;
const OKLCH_VALUE = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/;
/** A shared code never needs more than this; anything longer is refused before parsing. */
const MAX_CODE_LENGTH = 8000;

const round = (v: number) => Number(v.toFixed(4));
const pair = (v: { hue: number; chroma: number }) => [round(v.hue), round(v.chroma)];
const sameSteps = (a: readonly number[], b: readonly number[]) => a.every((v, i) => v === b[i]);

/** `oklch(53% 0.19 263)` to `53 0.19 263`: overrides travel as bare numbers. */
function packOverrides(map: Overrides): Record<string, string> | undefined {
  const entries = Object.entries(map).flatMap(([name, value]): [string, string][] => {
    const m = OKLCH_VALUE.exec(value);
    if (m === null) return [];
    return [[name, [m[1], m[2], m[3], ...(m[4] === undefined ? [] : [m[4]])].join(' ')]];
  });
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** The theme as a code: compact, versioned, URL safe. */
export function encodeTheme(inputs: ThemeInputs): string {
  const { color } = inputs;
  const steps = color.steps ?? DEFAULT_STEPS;
  const fonts = ROLES.map((r) => inputs.fonts[r]);
  const light = packOverrides(inputs.overrides.light);
  const dark = packOverrides(inputs.overrides.dark);
  const body: Record<string, unknown> = {
    ...(inputs.name === DEFAULT_NAME ? {} : { n: inputs.name }),
    ...(inputs.base === 'default' ? { k: 1 } : {}),
    b: pair(color.brand),
    u: pair(color.neutral),
    ...(color.ink === undefined ? {} : { i: pair(color.ink) }),
    d: round(color.depth),
    ...(sameSteps(steps, DEFAULT_STEPS) ? {} : { s: steps.map(round) }),
    ...((color.text ?? DEFAULT_TEXT) === DEFAULT_TEXT ? {} : { t: round(color.text ?? 0) }),
    m: `${color.solids.light === 'ink' ? 'i' : 'l'}${color.solids.dark === 'dark' ? 'd' : 'l'}`,
    ...(color.accentL === undefined ? {} : { a: round(color.accentL) }),
    ...((color.selectedChroma ?? DEFAULT_SELECTED_CHROMA) === DEFAULT_SELECTED_CHROMA
      ? {}
      : { c: round(color.selectedChroma ?? 0) }),
    ...(tuning(color) === undefined ? {} : { e: tuning(color) }),
    ...(inputs.radius === 'default' ? {} : { r: inputs.radius }),
    ...(inputs.density === 'compact' ? { y: 'c' } : {}),
    ...(ROLES.every((r) => inputs.fonts[r] === DEFAULT_FONTS[r]) ? {} : { f: fonts }),
    ...(light === undefined && dark === undefined
      ? {}
      : {
          x: {
            ...(light === undefined ? {} : { l: light }),
            ...(dark === undefined ? {} : { d: dark }),
          },
        }),
  };
  return `${String(CODE_VERSION)}.${toBase64Url(JSON.stringify(body))}`;
}

export class ThemeCodeError extends Error {
  override name = 'ThemeCodeError';
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function num(value: unknown, what: string, [min, max]: readonly [number, number]): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new ThemeCodeError(`${what} is not a number`);
  if (value < min || value > max)
    throw new ThemeCodeError(
      `${what} ${String(value)} is outside ${String(min)} to ${String(max)}`,
    );
  return value;
}

function hc(value: unknown, what: string, chroma: readonly [number, number]) {
  if (!Array.isArray(value) || value.length !== 2)
    throw new ThemeCodeError(`${what} is not [hue, chroma]`);
  return {
    hue: num(value[0], `${what} hue`, RANGES.hue),
    chroma: num(value[1], `${what} chroma`, chroma),
  };
}

function unpackOverrides(value: unknown, mode: string): Overrides {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new ThemeCodeError(`${mode} overrides are not an object`);
  const out: Overrides = {};
  for (const [name, raw] of Object.entries(value)) {
    if (!OVERRIDE.test(name) || name.length > 64)
      throw new ThemeCodeError(`"${name}" is not a token name`);
    if (typeof raw !== 'string') throw new ThemeCodeError(`${name} is not a colour`);
    const [l, c, h, a] = raw.split(' ').map(Number);
    if (l === undefined || c === undefined || h === undefined)
      throw new ThemeCodeError(`${name} is not "L C H"`);
    num(l, `${name} lightness`, [0, 100]);
    num(c, `${name} chroma`, [0, 0.5]);
    num(h, `${name} hue`, RANGES.hue);
    if (a !== undefined) num(a, `${name} alpha`, [0, 1]);
    out[name] =
      `oklch(${String(l)}% ${String(c)} ${String(h)}${a === undefined ? '' : ` / ${String(a)}`})`;
  }
  return out;
}

type Color = ThemeInputs['color'];

/**
 * A preset's fine tuning (selected step, tint chroma, hairline, chart series, flat hover, strong
 * accent) under one key, so a tuned preset such as Graphite survives the link exactly.
 */
function tuning(color: Color): Record<string, unknown> | undefined {
  const e: Record<string, unknown> = {
    ...(color.selectedStep === undefined ? {} : { p: round(color.selectedStep) }),
    ...(color.subtleChroma === undefined ? {} : { v: round(color.subtleChroma) }),
    ...(color.borderL === undefined ? {} : { o: round(color.borderL) }),
    ...(color.seriesL === undefined ? {} : { q: round(color.seriesL) }),
    ...(color.seriesChroma === undefined ? {} : { w: round(color.seriesChroma) }),
    ...(color.flatHover === true ? { h: 1 } : {}),
    ...(color.strong === undefined ? {} : { g: color.strong.map(round) }),
  };
  return Object.keys(e).length === 0 ? undefined : e;
}

function untuning(value: unknown): Partial<Color> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new ThemeCodeError('fine tuning is not an object');
  const strong = value.g;
  if (strong !== undefined && (!Array.isArray(strong) || strong.length !== 2))
    throw new ThemeCodeError('strong accent is not [lightness, chroma]');
  return {
    ...(value.p === undefined
      ? {}
      : { selectedStep: num(value.p, 'selected step', RANGES.selectedStep) }),
    ...(value.v === undefined
      ? {}
      : { subtleChroma: num(value.v, 'accent tint chroma', RANGES.subtleChroma) }),
    ...(value.o === undefined ? {} : { borderL: num(value.o, 'border lightness', RANGES.borderL) }),
    ...(value.q === undefined ? {} : { seriesL: num(value.q, 'series lightness', RANGES.seriesL) }),
    ...(value.w === undefined
      ? {}
      : { seriesChroma: num(value.w, 'series chroma', RANGES.seriesChroma) }),
    ...(value.h === 1 ? { flatHover: true } : {}),
    ...(strong === undefined
      ? {}
      : {
          strong: [
            num(strong[0], 'strong accent lightness', RANGES.strongL),
            num(strong[1], 'strong accent chroma', RANGES.strongChroma),
          ],
        }),
  };
}

/**
 * Reads a code (or a share link holding one) back into inputs. Every value is checked against
 * RANGES; a bad code throws ThemeCodeError with what is wrong, never a half-read theme.
 */
export function decodeTheme(codeOrUrl: string): ThemeInputs {
  const code = extractCode(codeOrUrl);
  if (code === undefined) throw new ThemeCodeError('no theme code found');
  if (code.length > MAX_CODE_LENGTH) throw new ThemeCodeError('the theme code is too long');
  const dot = code.indexOf('.');
  const version = code.slice(0, dot);
  if (dot < 1 || !/^\d+$/.test(version)) throw new ThemeCodeError('the theme code has no version');
  if (Number(version) !== CODE_VERSION)
    throw new ThemeCodeError(
      `the theme code is version ${version}; this reader knows version ${String(CODE_VERSION)}`,
    );
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(code.slice(dot + 1)));
  } catch {
    throw new ThemeCodeError('the theme code is damaged');
  }
  if (!isRecord(raw)) throw new ThemeCodeError('the theme code is damaged');

  const name = raw.n === undefined ? DEFAULT_NAME : raw.n;
  if (typeof name !== 'string' || slugName(name) !== name)
    throw new ThemeCodeError('the theme name is not a lowercase id');
  const m = raw.m ?? 'll';
  if (typeof m !== 'string' || !/^[li][ld]$/.test(m))
    throw new ThemeCodeError('unknown solid style');
  const steps =
    raw.s === undefined
      ? undefined
      : Array.isArray(raw.s) && raw.s.length === 4
        ? (raw.s.map((v, i) => num(v, `step ${String(i + 1)}`, RANGES.step)) as [
            number,
            number,
            number,
            number,
          ])
        : (() => {
            throw new ThemeCodeError('steps are not four numbers');
          })();
  const radius = RADII.find((r) => r.id === (raw.r ?? 'default'))?.id;
  if (radius === undefined) throw new ThemeCodeError('unknown radius');
  const fonts = { ...DEFAULT_FONTS };
  if (raw.f !== undefined) {
    if (!Array.isArray(raw.f) || raw.f.length !== 4)
      throw new ThemeCodeError('fonts are not four ids');
    const ids: unknown[] = raw.f;
    ROLES.forEach((role, i) => {
      const id = ids[i];
      const font = FONTS.find((f) => f.id === id);
      if (!font?.roles.includes(role))
        throw new ThemeCodeError(`"${String(id)}" is not a ${role} font`);
      fonts[role] = font.id;
    });
  }
  const x = raw.x === undefined ? {} : raw.x;
  if (!isRecord(x)) throw new ThemeCodeError('overrides are not an object');

  return {
    name,
    base: raw.k === 1 ? 'default' : 'derived',
    color: {
      brand: hc(raw.b, 'brand', RANGES.brandChroma),
      neutral: hc(raw.u, 'neutral', RANGES.neutralChroma),
      ...(raw.i === undefined ? {} : { ink: hc(raw.i, 'ink', RANGES.neutralChroma) }),
      depth: num(raw.d, 'depth', RANGES.depth),
      ...(steps === undefined ? {} : { steps }),
      ...(raw.t === undefined ? {} : { text: num(raw.t, 'text', RANGES.text) }),
      solids: { light: m.startsWith('i') ? 'ink' : 'light', dark: m[1] === 'd' ? 'dark' : 'light' },
      ...(raw.a === undefined ? {} : { accentL: num(raw.a, 'accent lightness', RANGES.accentL) }),
      ...(raw.c === undefined
        ? {}
        : { selectedChroma: num(raw.c, 'selected tint', RANGES.selectedChroma) }),
      ...untuning(raw.e),
    },
    radius,
    density: raw.y === 'c' ? 'compact' : 'comfortable',
    fonts,
    overrides: { light: unpackOverrides(x.l, 'light'), dark: unpackOverrides(x.d, 'dark') },
  };
}

/** The code inside a share link (`...?theme=1.xyz`), or the argument itself when it is a code. */
export function extractCode(value: string): string | undefined {
  const text = value.trim();
  if (/^\d+\.[A-Za-z0-9_-]+$/.test(text)) return text;
  try {
    const url = new URL(text);
    return (
      url.searchParams.get(CODE_PARAM) ??
      new URLSearchParams(url.hash.slice(1)).get(CODE_PARAM) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

/** Whether a CLI argument is a theme link or code rather than a registry item name. */
export function isThemeReference(value: string): boolean {
  return /^https?:\/\//i.test(value.trim()) || /^\d+\.[A-Za-z0-9_-]+$/.test(value.trim());
}
