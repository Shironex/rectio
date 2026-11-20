import { pad, visibleWidth, type Styles, type Terminal } from './style.ts';

/** `key  value` rows with dim keys, the values lined up. Empty keys continue the row above. */
export function keyValues(rows: readonly (readonly [string, string])[], s: Styles): string[] {
  const width = Math.max(0, ...rows.map(([key]) => key.length));
  return rows.map(([key, value]) => `${s.dim(pad(key, width))}  ${value}`);
}

/** `command   description` rows, the descriptions dim and lined up. */
export function commandRows(
  rows: readonly (readonly [string, string])[],
  s: Styles,
  indent = '  ',
): string[] {
  const width = Math.max(0, ...rows.map(([command]) => visibleWidth(command)));
  return rows.map(([command, about]) =>
    about === '' ? `${indent}${command}` : `${indent}${pad(command, width)}  ${s.dim(about)}`,
  );
}

/** Words joined by `separator`, broken into lines no wider than `width`. */
export function wrap(words: readonly string[], width: number, separator = ', '): string[] {
  const lines: string[] = [];
  let current = '';
  for (const [i, word] of words.entries()) {
    const piece = i < words.length - 1 ? `${word}${separator.trimEnd()}` : word;
    const next = current === '' ? piece : `${current} ${piece}`;
    if (current !== '' && visibleWidth(next) > width) {
      lines.push(current);
      current = piece;
    } else current = next;
  }
  if (current !== '') lines.push(current);
  return lines;
}

/** `── Title (12) ─────`, as wide as the terminal allows (at most 72 columns). */
export function rule(title: string, term: Terminal, s: Styles, indent = ''): string {
  const dash = term.utf8 ? '─' : '-';
  const width = Math.min(72, term.columns - indent.length);
  const tail = Math.max(3, width - visibleWidth(title) - 4);
  return `${indent}${s.dim(dash.repeat(2))} ${s.bold(title)} ${s.dim(dash.repeat(tail))}`;
}

/**
 * The closing summary: a rounded dim box with a bold first line. The same lines without borders
 * when the layout is plain, or when the box would not fit the terminal.
 */
export function box(lines: readonly string[], term: Terminal, s: Styles): string[] {
  const [first = '', ...rest] = lines;
  const indent = term.fancy ? '  ' : '';
  const width = Math.max(...lines.map(visibleWidth));
  if (!term.fancy || width + 6 > term.columns) {
    return ['', `${indent}${s.bold(first)}`, ...rest.map((line) => `${indent}${line}`.trimEnd())];
  }
  const [h, v, tl, tr, bl, br] = term.utf8
    ? ['─', '│', '╭', '╮', '╰', '╯']
    : ['-', '|', '+', '+', '+', '+'];
  const edge = h.repeat(width + 2);
  const row = (text: string) => `${indent}${s.dim(v)} ${pad(text, width)} ${s.dim(v)}`;
  return [
    '',
    `${indent}${s.dim(`${tl}${edge}${tr}`)}`,
    row(s.bold(first)),
    ...rest.map(row),
    `${indent}${s.dim(`${bl}${edge}${br}`)}`,
  ];
}

/** 1.2s under ten seconds, whole seconds above. */
export function duration(ms: number): string {
  const seconds = Math.max(0, ms) / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${String(Math.round(seconds))}s`;
}

/** `1 file`, `4 files`. */
export const plural = (count: number, one: string, many = `${one}s`): string =>
  `${String(count)} ${count === 1 ? one : many}`;
