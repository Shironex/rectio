// @ts-check
import { describe, expect, it } from 'vitest';

import { stringPieces } from './pieces.js';

/** @param {string} source */
const pieces = (source) => stringPieces(source, true).map((p) => [p.text, p.selector]);

describe('stringPieces', () => {
  it('marks the first argument of a selector method', () => {
    expect(
      pieces(`
        list.querySelector<HTMLElement>('[data-slot="select-item"]');
        node?.closest("[data-row]");
        el.matches(\`[data-id="\${id}"]\`);
      `),
    ).toEqual([
      [`'[data-slot="select-item"]'`, true],
      ['"[data-row]"', true],
      ['`[data-id="${', true],
      ['}"]`', true],
    ]);
  });

  it('leaves class lists and other calls unmarked', () => {
    expect(
      pieces(`
        const a = cn('rounded-[6px]', \`px-\${n} bg-surface\`);
        querySelector('[x]');
        el.closest('[a]', 'b');
        <div className="p-2" />;
      `),
    ).toEqual([
      ["'rounded-[6px]'", false],
      ['`px-${', false],
      ['} bg-surface`', false],
      // A bare function of that name is not the DOM method.
      ["'[x]'", false],
      ["'[a]'", true],
      ["'b'", false],
      ['"p-2"', false],
    ]);
  });

  it('reads code after a template substitution as code, not template text', () => {
    expect(pieces('const s = `a${b}c`; const t = "d";')).toEqual([
      ['`a${', false],
      ['}c`', false],
      ['"d"', false],
    ]);
  });
});
