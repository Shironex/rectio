import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineRegistry } from './src/build/config.ts';

const packages = join(dirname(fileURLToPath(import.meta.url)), '..');
const ui = join(packages, 'ui');
const tokens = join(packages, 'tokens');
const motion = join(packages, 'motion');

/** A motion add-on item: pro, installed under `@ui/motion/` beside the plain components. */
const motionItem = (
  name: string,
  title: string,
  description: string,
  files: string[],
  type: 'component' | 'lib' = 'component',
) => ({
  name: `motion-${name}`,
  type,
  tier: 'pro' as const,
  version: '0.1.0',
  title,
  description,
  categories: ['motion'],
  files,
});

/**
 * What the registry publishes. Every folder in packages/ui/src must belong to an item, so a new
 * component fails the build until it is listed here with its tier and version. Bump an item's
 * version whenever its published content changes: versioned copies are immutable.
 */
export default defineRegistry({
  name: 'rectio',
  homepage: 'https://rectio.dev',
  sourceDir: join(ui, 'src'),
  packageJsons: [
    join(ui, 'package.json'),
    join(tokens, 'package.json'),
    join(motion, 'package.json'),
  ],
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
    {
      name: 'badge',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Badge',
      description: 'A record state in words, tinted neutral, positive, negative, warning or info.',
      categories: ['finance'],
      files: ['badge/badge.tsx'],
    },
    {
      name: 'checkbox',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Checkbox',
      description: 'A checkbox with an indeterminate state for partial selections.',
      categories: ['forms'],
      files: ['checkbox/checkbox.tsx'],
    },
    {
      name: 'data-table',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'DataTable',
      description:
        'Composable table on TanStack Table: sorting (with a Sort by control for phones), row selection, sticky header, totals footer, loading, empty and pagination.',
      categories: ['data', 'finance'],
      files: [
        'data-table/table.tsx',
        'data-table/data-table.tsx',
        'data-table/pagination.tsx',
        'data-table/sort.tsx',
      ],
    },
    {
      name: 'calendar',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Calendar',
      description: 'A token-styled month grid on react-day-picker with locale week starts.',
      categories: ['forms'],
      files: ['calendar/calendar.tsx', 'calendar/locales.ts'],
    },
    {
      name: 'date-picker',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'DatePicker',
      description:
        'A typed date field with a calendar popup, plus a date range picker. Pairs with Field.',
      categories: ['forms'],
      files: ['date-picker/date-picker.tsx'],
    },
    {
      name: 'toast',
      type: 'component',
      tier: 'free',
      version: '0.1.0',
      title: 'Toast',
      description: 'Success, error and info toasts with an action such as Undo, on Base UI Toast.',
      categories: ['feedback'],
      files: ['toast/toast.tsx'],
    },
  ],
  // The motion add-on: imports of @rectio/ui become registry dependencies on the plain items.
  workspacePackages: { '@rectio/ui': join(ui, 'src', 'index.ts') },
  addons: [
    {
      sourceDir: join(motion, 'src'),
      targetFolder: 'motion',
      requireEveryFolder: true,
      items: [
        motionItem(
          'core',
          'Motion core',
          'Token reader, reduced motion switch and the Web Animations runner the motioned components share.',
          ['lib/animate.ts', 'lib/mode.tsx', 'lib/ref.ts', 'lib/tokens.ts'],
          'lib',
        ),
        motionItem(
          'button',
          'Motion Button',
          'Button with a spring press and a morphing loading state.',
          ['button/button.tsx'],
        ),
        motionItem(
          'amount-input',
          'Motion AmountInput',
          'AmountInput whose figures nudge in the direction of a step.',
          ['amount-input/amount-input.tsx'],
        ),
        motionItem('money', 'Motion Money', 'Money that counts to a new figure.', [
          'money/money.tsx',
        ]),
        motionItem('dialog', 'Motion Dialog', 'Dialog that springs out of its trigger and back.', [
          'dialog/dialog.tsx',
        ]),
        motionItem('select', 'Motion Select', 'Select popup with a gliding highlight.', [
          'select/select.tsx',
        ]),
        motionItem(
          'data-table',
          'Motion DataTable rows',
          'Rows that open and close in place, for DataTable or a plain Table.',
          ['table/table.tsx'],
        ),
        motionItem(
          'toast',
          'Motion Toast',
          'Toasts with a calm entrance and a stack that glides.',
          ['toast/toast.tsx'],
        ),
      ],
    },
  ],
});
