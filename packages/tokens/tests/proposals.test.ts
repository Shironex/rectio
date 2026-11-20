import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { difference, type ColorVision } from '../scripts/color.ts';
import { derivePairs, evaluate, parseOklch } from '../scripts/contrast.ts';

interface Built {
  proposals?: Record<string, Record<string, Record<string, string>>>;
}

const built = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Built;

const proposals = Object.entries(built.proposals ?? {}).map(([name, themes]) => ({
  name,
  tokens: themes.default ?? {},
}));
const pairs = derivePairs();
const color = (tokens: Record<string, string>, name: string) => {
  const c = parseOklch(tokens[`--rx-${name}`]);
  if (c === undefined) throw new Error(`${name} is not an oklch colour`);
  return c;
};

const VISIONS: (ColorVision | undefined)[] = [undefined, 'protan', 'deutan', 'tritan'];
const SERIES = [1, 2, 3].map((n) => `chart-series-${String(n)}`);
const SEQUENCE = [1, 2, 3, 4, 5].map((n) => `chart-sequence-${String(n)}`);

describe('dark proposals', () => {
  it('exist', () => {
    expect(proposals.length).toBeGreaterThan(0);
  });

  // Every pair the kit draws, derived from its class names: WCAG 2.2 AA (4.5:1 text, 3:1 edges).
  it.each(proposals)('$name passes every pair the kit uses', ({ tokens }) => {
    const failures = evaluate(tokens, pairs)
      .filter((r) => !r.pass)
      .map((r) => `${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${String(r.min)}`);
    expect([...new Set(failures)]).toEqual([]);
  });

  it.each(proposals)('$name chart series stay apart in hue and lightness', ({ tokens }) => {
    const failures = SERIES.flatMap((a, i) =>
      SERIES.slice(i + 1).flatMap((b) => {
        const ca = color(tokens, a);
        const cb = color(tokens, b);
        const out = VISIONS.flatMap((v) => {
          const gap = difference(ca, cb, v);
          return gap >= 0.09 ? [] : [`${a}/${b} ${v ?? 'typical'}: ${gap.toFixed(3)}`];
        });
        if (Math.abs(ca.l - cb.l) < 0.1)
          out.push(`${a}/${b} lightness ${Math.abs(ca.l - cb.l).toFixed(3)}`);
        return out;
      }),
    );
    expect(failures).toEqual([]);
  });

  it.each(proposals)('$name neighbouring sequence steps stay apart', ({ tokens }) => {
    const failures = SEQUENCE.slice(1).flatMap((b, i) => {
      const a = SEQUENCE[i] ?? '';
      return VISIONS.flatMap((v) => {
        const gap = difference(color(tokens, a), color(tokens, b), v);
        return gap >= 0.1 ? [] : [`${a}/${b} ${v ?? 'typical'}: ${gap.toFixed(3)}`];
      });
    });
    expect(failures).toEqual([]);
  });

  // The selected fill is a tint, never a saturated block, and still reads as a step off the canvas.
  it.each(proposals)('$name selected fill is a quiet tint', ({ tokens }) => {
    const selected = color(tokens, 'surface-selected');
    expect(selected.c).toBeLessThanOrEqual(0.05);
    expect(selected.l - color(tokens, 'surface-canvas').l).toBeGreaterThanOrEqual(0.08);
  });
});
