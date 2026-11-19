import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineRegistry } from './src/build/config.ts';

const packages = join(dirname(fileURLToPath(import.meta.url)), '..');
const ui = join(packages, 'ui');
const tokens = join(packages, 'tokens');
const motion = join(packages, 'motion');
const blocks = join(packages, 'blocks');

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

/** A finance block: pro, installed under `@blocks/finance/`, with its motioned twin beside it. */
const blockItems = (
  name: string,
  title: string,
  description: string,
  folder: string,
  file: string,
) => [
  {
    name,
    type: 'block' as const,
    tier: 'pro' as const,
    version: '0.1.0',
    title,
    description,
    categories: ['finance', 'blocks'],
    files: [`${folder}/${file}.tsx`, `${folder}/${folder}.logic.ts`],
  },
  {
    name: `motion-${name}`,
    type: 'block' as const,
    tier: 'pro' as const,
    version: '0.1.0',
    title: `Motion ${title}`,
    description: `${title} with entrances that play once, on first view.`,
    categories: ['finance', 'blocks', 'motion'],
    files: [`${folder}/${file}.motion.tsx`],
  },
];

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
    join(blocks, 'package.json'),
  ],
  requireEveryFolder: true,
  tokens: {
    dir: tokens,
    item: {
      version: '0.2.1',
      title: 'Tokens',
      description:
        'The Tailwind v4 theme mapped to rectio tokens, density and reduced motion. Installed by init.',
    },
    themes: [
      {
        id: 'default',
        tier: 'free',
        version: '0.2.1',
        title: 'Default theme',
        description: 'Warm stone neutrals, cobalt accent, 4px controls, IBM Plex. Light and dark.',
      },
      {
        id: 'ledger',
        tier: 'free',
        version: '0.2.1',
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
      version: '0.2.0',
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
      version: '0.2.0',
      title: 'Button',
      description: 'Primary, secondary, ghost and danger buttons with a loading state.',
      categories: ['actions'],
      files: ['button/button.tsx'],
    },
    {
      name: 'field',
      type: 'component',
      tier: 'free',
      version: '0.2.0',
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
      version: '0.2.0',
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
      version: '0.2.0',
      title: 'Checkbox',
      description: 'A checkbox with an indeterminate state for partial selections.',
      categories: ['forms'],
      files: ['checkbox/checkbox.tsx'],
    },
    {
      name: 'data-table',
      type: 'component',
      tier: 'free',
      version: '0.2.0',
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
      version: '0.2.1',
      title: 'Calendar',
      description:
        'A token-styled month grid on DayPicker (@daypicker/react) with locale week starts.',
      categories: ['forms'],
      files: ['calendar/calendar.tsx', 'calendar/locales.ts'],
    },
    {
      name: 'date-picker',
      type: 'component',
      tier: 'free',
      version: '0.2.0',
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
      version: '0.2.0',
      title: 'Toast',
      description: 'Success, error and info toasts with an action such as Undo, on Base UI Toast.',
      categories: ['feedback'],
      files: ['toast/toast.tsx'],
    },
  ],
  // Add-ons: imports of @rectio/ui and @rectio/motion become registry dependencies on their items.
  workspacePackages: {
    '@rectio/ui': join(ui, 'src', 'index.ts'),
    '@rectio/motion': join(motion, 'src', 'index.ts'),
  },
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
    {
      sourceDir: join(blocks, 'src'),
      targetFolder: 'finance',
      requireEveryFolder: true,
      items: [
        {
          name: 'blocks-core',
          type: 'lib',
          tier: 'pro',
          version: '0.1.0',
          title: 'Blocks core',
          description:
            'Money maths in minor units, the panel, chart theming with a table fallback, and the parts every finance block shares.',
          categories: ['finance', 'blocks'],
          files: [
            'lib/finance.ts',
            'lib/block-parts.tsx',
            'lib/block-panel.tsx',
            'lib/chart.tsx',
            'lib/choice-select.tsx',
            'lib/empty-note.tsx',
            'lib/figures.tsx',
            'lib/segmented.tsx',
            'lib/state-badge.tsx',
          ],
        },
        {
          name: 'motion-blocks-core',
          type: 'lib',
          tier: 'pro',
          version: '0.1.0',
          title: 'Motion blocks core',
          description:
            'First-view entrances, chart bars that grow from the baseline and rows that leave without a jump.',
          categories: ['finance', 'blocks', 'motion'],
          files: ['lib/motion-parts.tsx'],
        },
        ...blockItems(
          'kpi-row',
          'KPI row',
          'Key figures with their change in words and a sparkline.',
          'kpi-row',
          'kpi-row',
        ),
        ...blockItems(
          'cash-flow',
          'Cash flow chart',
          'Inflow, outflow and net by month or quarter, with a table fallback.',
          'cash-flow',
          'cash-flow-chart',
        ),
        ...blockItems(
          'invoice-list',
          'Invoice list',
          'Invoices with totals, status filters, period switch and a totals footer.',
          'invoice-list',
          'invoice-list',
        ),
        ...blockItems(
          'invoice-detail',
          'Invoice detail',
          'One invoice: parties, lines, VAT per rate, payments and balance due.',
          'invoice-detail',
          'invoice-detail',
        ),
        ...blockItems(
          'ledger',
          'General journal',
          'Journal entries or one account with a running balance, checked for balance.',
          'ledger',
          'ledger',
        ),
        ...blockItems(
          'expense-approval',
          'Expense approval',
          'Pending expenses, approve or reject with a reason, bulk actions and an audit trail.',
          'expense-approval',
          'expense-approval',
        ),
        ...blockItems(
          'ar-aging',
          'Receivables aging',
          'Receivables by days past due, as a chart and per customer.',
          'ar-aging',
          'ar-aging',
        ),
        ...blockItems(
          'budget-vs-actual',
          'Budget vs actual',
          'Budget against actual per category, variance in sign, arrow and words.',
          'budget-vs-actual',
          'budget-vs-actual',
        ),
      ],
    },
  ],
});
