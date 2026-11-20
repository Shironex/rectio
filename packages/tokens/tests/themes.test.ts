import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { contrast, difference, type ColorVision, type Oklch } from '../scripts/color.ts';

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
  ['text-subtle', 'surface-canvas', 4.5],
  ['text-subtle', 'surface-overlay', 4.5],
  ['text-subtle', 'surface-inset', 4.5],
  ['text', 'surface-inset', 4.5],
  // Popovers and toasts: the calendar's today marker, a toast's description and status icon.
  ['text-muted', 'surface-overlay', 4.5],
  ['accent-strong', 'surface-overlay', 4.5],
  ['positive-strong', 'surface-overlay', 3],
  ['negative-strong', 'surface-overlay', 3],
  // The docs sidebar's current page and a highlighted search result sit on the hover fill.
  ['accent-strong', 'surface-hover', 4.5],
  ['text', 'surface-hover', 4.5],
  ['text-muted', 'surface-hover', 4.5],
  // A selected table row keeps its secondary text readable.
  ['text-muted', 'surface-selected', 4.5],
  ['accent-contrast', 'accent', 4.5],
  ['accent-contrast', 'accent-hover', 4.5],
  ['accent-strong', 'surface', 4.5],
  ['accent-strong', 'accent-subtle', 4.5],
  ['text', 'surface-selected', 4.5],
  // The highlighted option in a Select list.
  ['text', 'accent-subtle', 4.5],
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
  // Initials on an avatar's identity tint.
  ...[1, 2, 3, 4, 5, 6].map((n): [string, string, number] => [
    `identity-${n}-strong`,
    `identity-${n}-subtle`,
    4.5,
  ]),
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

const SERIES = ['chart-series-1', 'chart-series-2', 'chart-series-3'];
const SEQUENCE = [1, 2, 3, 4, 5].map((step) => `chart-sequence-${String(step)}`);
const VISIONS: (ColorVision | undefined)[] = [undefined, 'protan', 'deutan', 'tritan'];
/** Marks that sit side by side: well past a just noticeable difference (about 0.02). */
const SERIES_APART = 0.09;
/** Neighbouring aging steps: clearly apart for every colour vision type, not just noticeable. */
const SEQUENCE_APART = 0.1;

describe('chart colours', () => {
  it.each(themeModes)('$key marks hold 3:1 against the surfaces they sit on', ({ tokens }) => {
    const marks = [...SERIES, ...SEQUENCE, 'chart-baseline', 'chart-axis'];
    const failures = marks.flatMap((mark) =>
      ['surface', 'surface-canvas', 'surface-raised'].flatMap((bg) => {
        const ratio = contrast(parse(tokens[`--rx-${mark}`]), parse(tokens[`--rx-${bg}`]));
        return ratio >= 3 ? [] : [`${mark} on ${bg}: ${ratio.toFixed(2)}`];
      }),
    );
    expect(failures).toEqual([]);
  });

  it.each(themeModes)('$key axis labels are readable text', ({ tokens }) => {
    const ratio = contrast(parse(tokens['--rx-chart-axis']), parse(tokens['--rx-surface']));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themeModes)('$key series stay apart for every colour vision type', ({ tokens }) => {
    const failures = SERIES.flatMap((a, i) =>
      SERIES.slice(i + 1).flatMap((b) =>
        VISIONS.flatMap((vision) => {
          const gap = difference(parse(tokens[`--rx-${a}`]), parse(tokens[`--rx-${b}`]), vision);
          return gap >= SERIES_APART ? [] : [`${a}/${b} ${vision ?? 'typical'}: ${gap.toFixed(3)}`];
        }),
      ),
    );
    expect(failures).toEqual([]);
  });

  it.each(themeModes)('$key neighbouring sequence steps stay apart', ({ tokens }) => {
    const failures = SEQUENCE.slice(1).flatMap((b, i) => {
      const a = SEQUENCE[i] ?? '';
      return VISIONS.flatMap((vision) => {
        const gap = difference(parse(tokens[`--rx-${a}`]), parse(tokens[`--rx-${b}`]), vision);
        return gap >= SEQUENCE_APART ? [] : [`${a}/${b} ${vision ?? 'typical'}: ${gap.toFixed(3)}`];
      });
    });
    expect(failures).toEqual([]);
  });

  it.each(themeModes)('$key tooltip text is readable', ({ tokens }) => {
    for (const fg of ['text', 'text-muted']) {
      const ratio = contrast(parse(tokens[`--rx-${fg}`]), parse(tokens['--rx-chart-tooltip']));
      expect(ratio, fg).toBeGreaterThanOrEqual(4.5);
    }
  });
});

const CODE_TOKENS = [
  'keyword',
  'string',
  'function',
  'constant',
  'parameter',
  'comment',
  'punctuation',
  'string-expression',
  'link',
].map((name) => `code-token-${name}`);

describe('code colours', () => {
  it.each(themeModes)('$key token colours are readable on every code line', ({ tokens }) => {
    const text = ['code-foreground', ...CODE_TOKENS];
    const lines = ['code-background', 'code-highlight', 'code-inserted', 'code-deleted'];
    const failures = text.flatMap((fg) =>
      lines.flatMap((bg) => {
        const ratio = contrast(parse(tokens[`--rx-${fg}`]), parse(tokens[`--rx-${bg}`]));
        return ratio >= 4.5 ? [] : [`${fg} on ${bg}: ${ratio.toFixed(2)}`];
      }),
    );
    expect(failures).toEqual([]);
  });

  it.each(themeModes)('$key gutter and diff marks are readable', ({ tokens }) => {
    const pairs: [string, string][] = [
      ['code-line-number', 'code-background'],
      ['code-inserted-mark', 'code-inserted'],
      ['code-deleted-mark', 'code-deleted'],
    ];
    const failures = pairs.flatMap(([fg, bg]) => {
      const ratio = contrast(parse(tokens[`--rx-${fg}`]), parse(tokens[`--rx-${bg}`]));
      return ratio >= 4.5 ? [] : [`${fg} on ${bg}: ${ratio.toFixed(2)}`];
    });
    expect(failures).toEqual([]);
  });
});

describe('selected fill', () => {
  const darkModes = themeModes.filter(({ key }) => key.endsWith('/dark'));

  // The current page in a sidebar sits on surface-selected. In dark mode it has to read as a step
  // above hover and clearly off the canvas, or the active item looks like a hovered one.
  it.each(darkModes)('$key selected sits above hover and off the canvas', ({ tokens }) => {
    const selected = parse(tokens['--rx-surface-selected']);
    const hover = parse(tokens['--rx-surface-hover']);
    expect(selected.l).toBeGreaterThan(hover.l);
    expect(contrast(selected, parse(tokens['--rx-surface-canvas']))).toBeGreaterThanOrEqual(1.25);
  });
});
