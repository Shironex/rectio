// @ts-check
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import plugin from './eslint.js';

RuleTester.describe = describe;
RuleTester.it = it;

const rule = plugin.rules?.['no-hardcoded-design-values'];
if (rule === undefined || typeof rule === 'function') throw new Error('rule missing');

new RuleTester({ languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } }).run(
  'no-hardcoded-design-values',
  rule,
  {
    valid: [
      'list.querySelector(\'[data-slot="select-item"][data-highlighted]\');',
      "document.querySelectorAll('[data-row]');",
      'node?.closest(`[data-row="${id}"]`);',
      "el.matches('[data-state=open]');",
      "const classes = 'bg-surface rounded-control';",
    ],
    invalid: [
      // A class list keeps its guard, even next to a selector call.
      { code: "const classes = 'rounded-[6px]';", errors: 1 },
      // Only the selector argument is exempt: a second argument is not a selector.
      { code: "x.closest('[data-a]', 'bg-[red]');", errors: 1 },
      // A method of another name gets no exemption.
      { code: 'cn(\'[data-slot="x"]\');', errors: 1 },
      // Other checks still run inside a selector.
      { code: 'el.querySelector(\'[style*="#fff"]\');', errors: 1 },
    ],
  },
);

const ring = plugin.rules?.['no-invisible-focus-ring'];
if (ring === undefined || typeof ring === 'function') throw new Error('rule missing');

new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
}).run('no-invisible-focus-ring', ring, {
  valid: [
    '<div className="outline-none focus-visible:outline-2 focus-visible:outline-solid" />;',
    // Without outline-none the outline style keeps its default, solid.
    '<div className="focus-visible:outline-2 focus-visible:outline-focus" />;',
    "cn('outline-none', 'focus-visible:outline-2', open && 'focus-visible:outline-solid');",
    // Separate elements in a record of class lists.
    "const PARTS = { a: 'outline-none', b: 'focus-visible:outline-2' };",
  ],
  invalid: [
    { code: '<div className="outline-none focus-visible:outline-2" />;', errors: 1 },
    { code: "<div className={cn('outline-none', ['focus-visible:outline-2'])} />;", errors: 1 },
    { code: "const ROW = ['outline-none', 'has-focus-visible:outline-2'];", errors: 1 },
    { code: "cn('outline-none focus-visible:outline-(--w)');", errors: 1 },
  ],
});
