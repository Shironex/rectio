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
