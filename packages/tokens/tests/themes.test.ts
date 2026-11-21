import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  contrast,
  difference,
  formatOklch,
  type ColorVision,
  type Oklch,
} from '../scripts/color.ts';
import { derivePairs, evaluate } from '../scripts/contrast.ts';
import { build, GRAPHITE } from '../scripts/derive.ts';

type ThemeModes = Record<string, Record<string, Record<string, string>>>;

interface Built {
  contract: { name: string; type: string }[];
  themes: ThemeModes;
  skins: Record<string, { tokens: Record<string, string>; themes: ThemeModes }>;
}

const built = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Built;

const modesOf = (themes: ThemeModes, suffix = '') =>
  Object.entries(themes).flatMap(([theme, modes]) =>
    Object.entries(modes).map(([mode, tokens]) => ({ key: `${theme}/${mode}${suffix}`, tokens })),
  );

// Every theme and mode, and each of them under every skin: a skin is held to the same contrast,
// colour vision and contract checks as the theme it sits on.
const themeModes = [
  ...modesOf(built.themes),
  ...Object.entries(built.skins).flatMap(([skin, { themes }]) => modesOf(themes, ` + ${skin}`)),
];

function parse(value: string | undefined): Oklch {
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value ?? '');
  if (m === null) throw new Error(`not an oklch colour: ${String(value)}`);
  return { l: Number(m[1]) / 100, c: Number(m[2]), h: Number(m[3]), alpha: Number(m[4] ?? 1) };
}

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

// Every pair the kit draws, read from the class names in its components, blocks, templates and
// site (scripts/contrast.ts): WCAG 2.2 AA, 4.5:1 for text and 3:1 for control edges and marks.
const pairs = derivePairs();

describe('contrast', () => {
  it('finds the pairs the kit draws', () => {
    expect(pairs.filter((p) => p.gate !== 'info').length).toBeGreaterThan(150);
  });

  it.each(themeModes)('$key passes every pair the kit draws', ({ tokens }) => {
    const failures = evaluate(tokens, pairs)
      .filter((r) => !r.pass)
      .map(
        (r) => `${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${String(r.min)} (${r.where[0] ?? ''})`,
      );
    expect([...new Set(failures)]).toEqual([]);
  });
});

describe('default dark', () => {
  // dark.json is generated from the Graphite preset; the theme generator starts from the same
  // inputs, so the shipped file must be exactly what the derivation gives.
  it('is what derive.ts gives for the Graphite preset', () => {
    const { tokens, fails } = build(GRAPHITE, 'dark', pairs);
    expect(fails).toEqual([]);
    const shipped = built.themes.default?.dark ?? {};
    const drift = [...tokens].flatMap(([name, c]) => {
      const s = parse(shipped[name]);
      const gap =
        Math.abs(s.l - c.l) +
        Math.abs(s.c - c.c) +
        Math.min(Math.abs(s.h - c.h), 360 - Math.abs(s.h - c.h)) / 360;
      return gap < 0.002 ? [] : [`${name}: ${String(shipped[name])} vs ${formatOklch(c)}`];
    });
    expect(drift, 'run node scripts/derive.ts').toEqual([]);
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

describe('dark elevation', () => {
  const darkModes = themeModes.filter(({ key }) => key.split(' ')[0]?.endsWith('/dark'));

  // Popovers, menus and toasts float: the overlay is clearly above a card, and a hovered row still
  // shows inside a menu.
  it.each(darkModes)('$key overlay floats and hover shows inside it', ({ tokens }) => {
    const l = (name: string) => parse(tokens[`--rx-${name}`]).l;
    expect(l('surface-overlay') - l('surface-raised')).toBeGreaterThanOrEqual(0.03);
    expect(l('surface-hover')).toBeGreaterThan(l('surface-overlay'));
    expect(l('accent-subtle')).toBeGreaterThan(l('surface-overlay'));
  });
});

describe('selected fill', () => {
  const darkModes = themeModes.filter(({ key }) => key.split(' ')[0]?.endsWith('/dark'));

  // The selected fill is a tint, never a saturated block.
  it.each(darkModes)('$key selected fill is a quiet tint', ({ tokens }) => {
    expect(parse(tokens['--rx-surface-selected']).c).toBeLessThanOrEqual(0.05);
  });

  // The current page in a sidebar sits on surface-selected. In dark mode it has to read as a step
  // above hover and clearly off the canvas, or the active item looks like a hovered one.
  it.each(darkModes)('$key selected sits above hover and off the canvas', ({ tokens }) => {
    const selected = parse(tokens['--rx-surface-selected']);
    const hover = parse(tokens['--rx-surface-hover']);
    expect(selected.l).toBeGreaterThan(hover.l);
    expect(contrast(selected, parse(tokens['--rx-surface-canvas']))).toBeGreaterThanOrEqual(1.25);
  });
});

describe('quiet text margin', () => {
  // Muted and subtle text is small and often sits on a tint; a ratio of 4.51 passes on paper and
  // fails after a browser's colour conversion or a slightly different display. Keep a margin.
  const SURFACES = [
    'surface',
    'surface-canvas',
    'surface-sunken',
    'surface-hover',
    'surface-selected',
  ];
  it.each(themeModes)('$key muted and subtle text clear AA with room to spare', ({ tokens }) => {
    const failures = ['text-muted', 'text-subtle'].flatMap((fg) =>
      SURFACES.flatMap((bg) => {
        const ratio = contrast(parse(tokens[`--rx-${fg}`]), parse(tokens[`--rx-${bg}`]));
        return ratio >= 4.75 ? [] : [`${fg} on ${bg}: ${ratio.toFixed(2)}`];
      }),
    );
    expect(failures).toEqual([]);
  });
});
