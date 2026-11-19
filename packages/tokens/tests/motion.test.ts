import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface Built {
  themes: Record<string, Record<string, Record<string, string>>>;
}

const built = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Built;

const themeModes = Object.entries(built.themes).flatMap(([theme, modes]) =>
  Object.entries(modes).map(([mode, tokens]) => ({ key: `${theme}/${mode}`, tokens })),
);

const SPRINGS = ['press', 'overlay'];

/**
 * Money software never bounces. A damping ratio of 1 is critical damping: the fastest settle with
 * no overshoot. A press may sit a hair under it; the overshoot of 0.95 is under 0.1 percent.
 */
const MIN_DAMPING_RATIO = 0.95;

describe('motion tokens', () => {
  it.each(themeModes)('$key springs settle without bouncing', ({ tokens }) => {
    for (const name of SPRINGS) {
      const read = (part: string) => Number(tokens[`--rx-motion-spring-${name}-${part}`]);
      const [stiffness, damping, mass] = [read('stiffness'), read('damping'), read('mass')];
      expect(stiffness, name).toBeGreaterThan(0);
      expect(mass, name).toBeGreaterThan(0);
      const ratio = damping / (2 * Math.sqrt(stiffness * mass));
      expect(ratio, `${name} damping ratio`).toBeGreaterThanOrEqual(MIN_DAMPING_RATIO);
    }
  });

  it.each(themeModes)('$key enters and leaves on an ease-out, never an ease-in', ({ tokens }) => {
    for (const name of ['enter', 'exit']) {
      const value = tokens[`--rx-motion-easing-${name}`] ?? '';
      const points = /^cubic-bezier\(([^)]*)\)$/.exec(value)?.[1]?.split(',').map(Number) ?? [];
      expect(points, name).toHaveLength(4);
      const [x1 = 0, y1 = 0] = points;
      // The first control point above the diagonal: the curve starts fast and lands softly.
      expect(y1, `${name} starts fast`).toBeGreaterThan(x1);
    }
  });

  it.each(themeModes)(
    '$key counts slower than any transition, but under a second',
    ({ tokens }) => {
      const ms = (name: string) => Number.parseFloat(tokens[`--rx-motion-duration-${name}`] ?? '');
      expect(ms('count')).toBeGreaterThan(ms('slow'));
      expect(ms('count')).toBeLessThan(1000);
    },
  );
});
