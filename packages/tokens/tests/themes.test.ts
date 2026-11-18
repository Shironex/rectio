import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { contrast, type Oklch } from '../scripts/color.ts';

interface Built {
  contract: { name: string; type: string }[];
  themes: Record<string, Record<string, Record<string, string>>>;
}

const built = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Built;

const themeModes = Object.entries(built.themes).flatMap(([theme, modes]) =>
  Object.entries(modes).map(([mode, tokens]) => ({ key: `${theme}/${mode}`, tokens })),
);

function parse(value: string | undefined): Oklch {
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value ?? '');
  if (m === null) throw new Error(`not an oklch colour: ${String(value)}`);
  return { l: Number(m[1]) / 100, c: Number(m[2]), h: Number(m[3]), alpha: Number(m[4] ?? 1) };
}

/** [foreground, background, minimum ratio]. 4.5 for text (WCAG 1.4.3), 3 for UI edges (1.4.11). */
const PAIRS: [string, string, number][] = [
  ['text', 'surface', 4.5],
  ['text', 'surface-canvas', 4.5],
  ['text', 'surface-overlay', 4.5],
  ['text', 'surface-sunken', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-canvas', 4.5],
  ['text-muted', 'surface-sunken', 4.5],
  ['text-subtle', 'surface', 4.5],
  ['text-subtle', 'surface-overlay', 4.5],
  ['text-subtle', 'surface-inset', 4.5],
  ['text', 'surface-inset', 4.5],
  ['accent-contrast', 'accent', 4.5],
  ['accent-contrast', 'accent-hover', 4.5],
  ['accent-strong', 'surface', 4.5],
  ['accent-strong', 'accent-subtle', 4.5],
  ['text', 'surface-selected', 4.5],
  ['positive-contrast', 'positive', 4.5],
  ['positive-strong', 'surface', 4.5],
  ['positive-strong', 'positive-subtle', 4.5],
  ['negative-contrast', 'negative', 4.5],
  ['negative-contrast', 'negative-hover', 4.5],
  ['negative-strong', 'surface', 4.5],
  ['negative-strong', 'negative-subtle', 4.5],
  ['warning-contrast', 'warning', 4.5],
  ['warning-strong', 'surface', 4.5],
  ['warning-strong', 'warning-subtle', 4.5],
  ['info-contrast', 'info', 4.5],
  ['info-strong', 'surface', 4.5],
  ['info-strong', 'info-subtle', 4.5],
  // Disabled values a user may still need to read (a limit, an approver): 3:1, beyond WCAG's exemption.
  ['text-disabled', 'surface', 3],
  ['text-disabled', 'surface-sunken', 3],
  ['border-strong', 'surface', 3],
  ['border-strong', 'surface-canvas', 3],
  ['focus', 'surface', 3],
  ['focus', 'surface-canvas', 3],
  ['focus', 'surface-overlay', 3],
];

describe('token contract', () => {
  it.each(themeModes)('$key defines every contract token', ({ tokens }) => {
    const missing = built.contract.map((t) => t.name).filter((name) => !(name in tokens));
    expect(missing).toEqual([]);
  });

  it.each(themeModes)('$key colours are valid oklch', ({ tokens }) => {
    const colors = built.contract.filter((t) => t.type === 'color').map((t) => t.name);
    for (const name of colors) {
      const value = tokens[name] ?? '';
      if (value.startsWith('var(')) continue;
      expect(() => parse(value), name).not.toThrow();
    }
  });
});

describe('contrast', () => {
  it.each(themeModes)('$key meets WCAG AA for its semantic pairs', ({ tokens }) => {
    const failures = PAIRS.flatMap(([fg, bg, min]) => {
      const ratio = contrast(parse(tokens[`--rx-${fg}`]), parse(tokens[`--rx-${bg}`]));
      return ratio >= min ? [] : [`${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`];
    });
    expect(failures).toEqual([]);
  });
});
