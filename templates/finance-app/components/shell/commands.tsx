import {
  BookOpenTextIcon,
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  CreditCardIcon,
  FilePlusIcon,
  FileTextIcon,
  GearSixIcon,
  HouseIcon,
  MoonIcon,
  PaletteIcon,
  ReceiptIcon,
  SignOutIcon,
  SunIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import type { CommandGroup } from '@rectio/ui';

import { INVOICES, OVERDUE_INVOICES } from '@/data/invoices';
import { icon } from './icon';

export interface CommandActions {
  go: (href: string) => void;
  newInvoice: () => void;
  submitExpense: () => void;
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark') => void;
  /** Whether the app shows dark right now, so only the switch to the other mode is offered. */
  dark: boolean;
}

/** Invoices the user is likely to want again: the largest overdue ones and the latest draft. */
const RECENT = [
  ...OVERDUE_INVOICES.slice(0, 2),
  ...INVOICES.filter((i) => i.status === 'draft').slice(0, 1),
];

/** The command menu's contents: every page, the common actions, and recent invoices. */
export function buildCommands(run: CommandActions): CommandGroup[] {
  const page = (
    id: string,
    label: string,
    href: string,
    Icon: Parameters<typeof icon>[0],
    keywords: string[],
  ) => ({
    id,
    label,
    icon: icon(Icon),
    keywords,
    onSelect: () => {
      run.go(href);
    },
  });
  return [
    {
      label: 'Recent',
      items: RECENT.map((invoice) => ({
        id: `recent-${invoice.id}`,
        label: `${invoice.number}, ${invoice.customer}`,
        icon: icon(ClockCounterClockwiseIcon),
        keywords: ['invoice', invoice.customer],
        onSelect: () => {
          run.go(`/invoices/${invoice.id}`);
        },
      })),
    },
    {
      label: 'Actions',
      items: [
        {
          id: 'new-invoice',
          label: 'New invoice',
          icon: icon(FilePlusIcon),
          keywords: ['create', 'bill a customer', 'draft'],
          shortcut: 'mod+i',
          onSelect: run.newInvoice,
        },
        {
          id: 'submit-expense',
          label: 'Submit an expense',
          icon: icon(ReceiptIcon),
          keywords: ['claim', 'receipt', 'reimburse'],
          onSelect: run.submitExpense,
        },
        {
          id: 'theme',
          label: 'Switch theme',
          icon: icon(PaletteIcon),
          keywords: ['ledger', 'default', 'appearance'],
          onSelect: run.toggleTheme,
        },
        run.dark
          ? {
              id: 'light',
              label: 'Use light mode',
              icon: icon(SunIcon),
              keywords: ['appearance', 'day', 'mode'],
              onSelect: () => {
                run.setMode('light');
              },
            }
          : {
              id: 'dark',
              label: 'Use dark mode',
              icon: icon(MoonIcon),
              keywords: ['appearance', 'night', 'mode'],
              onSelect: () => {
                run.setMode('dark');
              },
            },
        page('sign-out', 'Sign out', '/sign-in', SignOutIcon, ['log out', 'leave']),
      ],
    },
    {
      label: 'Pages',
      items: [
        page('overview', 'Overview', '/', HouseIcon, ['dashboard', 'home', 'cash']),
        page('invoices', 'Invoices', '/invoices', FileTextIcon, ['receivables', 'sales', 'AR']),
        page('expenses', 'Expenses', '/expenses', CreditCardIcon, ['approvals', 'claims']),
        page('journal', 'Journal', '/journal', BookOpenTextIcon, ['ledger', 'entries', 'GL']),
        page('bank', 'Bank account ledger', '/journal?account=1000', BookOpenTextIcon, [
          'AIB',
          'balance',
          'reconcile',
        ]),
        page('reports', 'Reports', '/reports', ChartLineUpIcon, [
          'profit and loss',
          'balance sheet',
          'budget',
        ]),
        page('settings', 'Settings', '/settings', GearSixIcon, ['company', 'preferences']),
        page('team', 'Team members', '/settings#team', UsersThreeIcon, ['users', 'invite']),
      ],
    },
  ];
}
