import {
  BellIcon,
  BuildingsIcon,
  ClockCounterClockwiseIcon,
  CodeIcon,
  CreditCardIcon,
  FolderSimpleIcon,
  GearSixIcon,
  HouseIcon,
  KanbanIcon,
  MoonIcon,
  PaletteIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  SunIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import type { CommandGroup } from '@rectio/ui';

import { CUSTOMERS } from '@/data/customers';
import { icon } from './icon';

export interface CommandActions {
  go: (href: string) => void;
  newTicket: () => void;
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark') => void;
  /** Whether the app shows dark right now, so only the switch to the other mode is offered. */
  dark: boolean;
  /** The theme shown now, so the theme command names the one it switches to. */
  ledger: boolean;
}

/** Customers the team is likely to want again: the at-risk accounts first. */
const RECENT = [...CUSTOMERS]
  .sort((a, b) => Number(b.health === 'at-risk') - Number(a.health === 'at-risk'))
  .slice(0, 3);

/** The command menu's contents: the common actions, recent customers and every page. */
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
      label: 'Actions',
      items: [
        {
          id: 'new-ticket',
          label: 'New ticket',
          icon: icon(PlusCircleIcon),
          keywords: ['create', 'log a call', 'issue'],
          shortcut: 'mod+i',
          onSelect: run.newTicket,
        },
        page('invite', 'Invite a teammate', '/team#invite', UserCirclePlusIcon, [
          'add member',
          'agent',
          'seat',
        ]),
        page('api-key', 'Create an API key', '/developers', CodeIcon, ['token', 'integration']),
        {
          id: 'theme',
          label: run.ledger ? 'Use the Default theme' : 'Use the Ledger theme',
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
      ],
    },
    {
      label: 'Customers',
      items: RECENT.map((customer) => ({
        id: `customer-${customer.id}`,
        label: customer.name,
        icon: icon(ClockCounterClockwiseIcon),
        keywords: ['customer', customer.contact.name, customer.city],
        onSelect: () => {
          run.go(`/customers/${customer.id}`);
        },
      })),
    },
    {
      label: 'Pages',
      items: [
        page('overview', 'Overview', '/', HouseIcon, ['dashboard', 'home', 'csat']),
        page('tickets', 'Tickets', '/tickets', KanbanIcon, ['board', 'queue', 'inbox']),
        page('customers', 'Customers', '/customers', BuildingsIcon, ['accounts', 'companies']),
        page('team', 'Team and roles', '/team', UsersThreeIcon, ['agents', 'members', 'roles']),
        page('files', 'Files', '/files', FolderSimpleIcon, ['macros', 'documents', 'exports']),
        page('notifications', 'Notifications', '/notifications', BellIcon, ['inbox', 'alerts']),
        page('billing', 'Billing and plan', '/billing', CreditCardIcon, ['invoice', 'seats']),
        page('developers', 'API keys and webhooks', '/developers', CodeIcon, ['developer']),
        page('settings', 'Settings', '/settings', GearSixIcon, ['profile', 'preferences']),
        page('security', 'Security and devices', '/settings/security', ShieldCheckIcon, [
          'two-factor',
          'password',
          'sessions',
        ]),
        page('whats-new', 'What’s new', '/whats-new', SparkleIcon, ['changelog', 'release']),
      ],
    },
    {
      label: 'Account',
      items: [page('sign-out', 'Sign out', '/sign-in', SignOutIcon, ['log out', 'leave'])],
    },
  ];
}
