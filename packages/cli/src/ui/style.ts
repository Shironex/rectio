import { stripVTControlCharacters } from 'node:util';

type Env = Readonly<Record<string, string | undefined>>;

/** What the terminal can show, decided once per command from the environment. */
export interface Terminal {
  /** ANSI colors and weights. */
  color: boolean;
  /** Spinners, the indent and box borders: a real terminal that is not CI, NO_COLOR or dumb. */
  fancy: boolean;
  /** Braille spinner and check marks; ASCII stand-ins otherwise. */
  utf8: boolean;
  /** Terminal width, for the box and the section rules. */
  columns: number;
}

export interface TerminalInput {
  env: Env;
  isTTY: boolean;
  columns?: number;
  platform?: NodeJS.Platform;
}

const set = (value: string | undefined) => value !== undefined && value !== '';
const off = (value: string | undefined) => value === '0' || value?.toLowerCase() === 'false';

/** The locale names UTF-8, or the platform is Windows (Windows Terminal and conhost draw it). */
export function supportsUtf8(env: Env, platform: NodeJS.Platform = process.platform): boolean {
  const locale = env.LC_ALL ?? env.LC_CTYPE ?? env.LANG ?? '';
  if (/utf-?8/i.test(locale)) return true;
  return platform === 'win32' && locale === '';
}

/**
 * NO_COLOR (https://no-color.org) and TERM=dumb turn color off, FORCE_COLOR turns it on even when
 * piped (FORCE_COLOR=0 turns it off), and otherwise color follows whether stdout is a terminal.
 * The fancy layout needs a real terminal outside CI, whatever FORCE_COLOR says.
 */
export function detectTerminal(input: TerminalInput): Terminal {
  const { env, isTTY } = input;
  const plainTerm = set(env.NO_COLOR) || env.TERM === 'dumb';
  const force = env.FORCE_COLOR;
  const color = force !== undefined ? !off(force) : isTTY && !plainTerm;
  const ci = set(env.CI) && !off(env.CI);
  return {
    color,
    fancy: isTTY && !ci && !plainTerm,
    utf8: supportsUtf8(env, input.platform),
    columns: input.columns !== undefined && input.columns > 0 ? input.columns : 80,
  };
}

const CODES = {
  bold: [1, 22],
  dim: [2, 22],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  cyan: [36, 39],
} as const;

export type StyleName = keyof typeof CODES;
export type Styles = Record<StyleName, (text: string) => string>;

/** The palette: cyan and green accents, dim for secondary text, red only for failures. */
export function styles(color: boolean): Styles {
  const make = ([open, close]: readonly [number, number]) =>
    color ? (text: string) => `\u001b[${open}m${text}\u001b[${close}m` : (text: string) => text;
  return {
    bold: make(CODES.bold),
    dim: make(CODES.dim),
    red: make(CODES.red),
    green: make(CODES.green),
    yellow: make(CODES.yellow),
    cyan: make(CODES.cyan),
  };
}

export interface Glyphs {
  ok: string;
  fail: string;
  skip: string;
  warn: string;
  arrow: string;
  frames: readonly string[];
}

export function glyphs(utf8: boolean): Glyphs {
  return utf8
    ? {
        ok: '✓',
        fail: '✗',
        skip: '-',
        warn: '!',
        arrow: '→',
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      }
    : { ok: '+', fail: 'x', skip: '-', warn: '!', arrow: '->', frames: ['|', '/', '-', '\\'] };
}

/** Visible width: escape codes take no room, and a surrogate pair is one column. */
export const visibleWidth = (text: string): number =>
  stripVTControlCharacters(text).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ').length;

export function pad(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - visibleWidth(text)));
}

export const ESC = {
  clearLine: '\r\u001b[K',
  hideCursor: '\u001b[?25l',
  showCursor: '\u001b[?25h',
} as const;
