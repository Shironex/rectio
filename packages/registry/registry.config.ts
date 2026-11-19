import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineRegistry } from './src/build/config.ts';

const packages = join(dirname(fileURLToPath(import.meta.url)), '..');
const ui = join(packages, 'ui');
const tokens = join(packages, 'tokens');

/**
 * What the registry publishes. Every folder in packages/ui/src must belong to an item, so a new
 * component fails the build until it is listed here with its tier and version. Bump an item's
 * version whenever its published content changes: versioned copies are immutable.
 */
export default defineRegistry({
  name: 'rectio',
  homepage: 'https://rectio.dev',
  sourceDir: join(ui, 'src'),
  packageJsons: [join(ui, 'package.json'), join(tokens, 'package.json')],
  requireEveryFolder: true,
  tokens: {
    dir: tokens,
    item: {
      version: '0.1.0',
      title: 'Tokens',
      description:
        'The Tailwind v4 theme mapped to rectio tokens, density and reduced motion. Installed by init.',
    },
    themes: [
      {
        id: 'default',
        tier: 'free',
        version: '0.1.0',
        title: 'Default theme',
        description: 'Warm stone neutrals, cobalt accent, 4px controls, IBM Plex. Light and dark.',
      },
      {
        id: 'ledger',
        tier: 'free',
        version: '0.1.0',
        title: 'Ledger theme',
        description:
          'Green-black ink, citron accent, 2px corners, slower motion, Source Serif 4 headings.',
      },
    ],
  },
  items: [
    {
      name: 'cn',
      type: 'lib',
      tier: 'free',
      version: '0.1.0',
      title: 'cn',
      description: 'Class name merging that knows the rectio token utilities.',
      files: ['lib/cn.ts'],
    },
    {
      name: 'theme-scope',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'ThemeScope',
      description: 'Applies a theme, mode and density to a subtree; popups render inside it.',
      categories: ['theming'],
      files: ['theme-scope/theme-scope.tsx'],
    },
    {
      name: 'button',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Button',
      description: 'Primary, secondary, ghost and danger buttons with a loading state.',
      categories: ['actions'],
      files: ['button/button.tsx'],
    },
    {
      name: 'field',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Field and Input',
      description: 'Label, description, error and text input wired for accessibility.',
      categories: ['forms'],
      files: ['field/field.tsx'],
    },
    {
      name: 'amount-input',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'AmountInput',
      description: 'Locale-aware money entry with the currency symbol in place.',
      categories: ['forms', 'finance'],
      files: ['amount-input/amount-input.tsx'],
    },
    {
      name: 'select',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Select',
      description: 'A select with a styled popup that follows the theme scope.',
      categories: ['forms'],
      files: ['select/select.tsx'],
    },
    {
      name: 'dialog',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Dialog',
      description: 'Modal dialog with header, body and footer, focus trapped and restored.',
      categories: ['overlays'],
      files: ['dialog/dialog.tsx'],
    },
    {
      name: 'money',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Money',
      description: 'A formatted amount in tabular figures with the true minus sign.',
      categories: ['finance'],
      files: ['money/money.tsx'],
    },
  ],
});
