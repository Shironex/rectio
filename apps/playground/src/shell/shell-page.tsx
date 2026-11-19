import {
  ArrowsLeftRightIcon,
  BankIcon,
  BellIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  FilePlusIcon,
  GearSixIcon,
  HouseIcon,
  MoonIcon,
  ReceiptIcon,
  SignOutIcon,
  UserCircleIcon,
  UsersThreeIcon,
  WalletIcon,
} from '@phosphor-icons/react';
import * as plainBlocks from '@rectio/blocks';
import * as movingBlocks from '@rectio/blocks/motion';
import * as movingNav from '@rectio/motion/navigation';
import {
  AppShell,
  AppShellHeader,
  Breadcrumb,
  Button,
  CommandMenu,
  CommandMenuTrigger,
  Menu,
  MenuContent as PlainMenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverContent as PlainPopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarSubItem,
  SidebarSubmenu,
  Tabs,
  TabsList as PlainTabsList,
  TabsPanel as PlainTabsPanel,
  TabsTab,
  ThemeScope,
  useShortcut,
  type CommandGroup,
} from '@rectio/ui';
import { useState } from 'react';

import * as data from '../blocks/data';
import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';

const icon = (Icon: typeof HouseIcon) => <Icon aria-hidden weight="regular" className="size-4" />;

function readParams(search: string) {
  const params = new URLSearchParams(search);
  return {
    collapsed: params.get('collapsed') === '1',
    locale: data.LOCALES[params.get('locale') === 'pl-PL' ? 'pl-PL' : 'en-GB'],
  };
}

/** The command menu's contents. Built once: rebuilding each render would refilter every time. */
function buildCommands(run: (message: string) => void): CommandGroup[] {
  const go = (id: string, label: string, Icon: typeof HouseIcon, keywords?: string[]) => ({
    id,
    label,
    icon: icon(Icon),
    ...(keywords === undefined ? {} : { keywords }),
    onSelect: () => {
      run(`Opened ${label}`);
    },
  });
  return [
    {
      label: 'Actions',
      items: [
        {
          ...go('new-invoice', 'New invoice', FilePlusIcon, ['create', 'bill customer']),
          shortcut: 'mod+i',
        },
        {
          ...go('transfer', 'Record a transfer', ArrowsLeftRightIcon, ['move money']),
          hint: 'Banking',
        },
        go('upload-receipt', 'Upload a receipt', ReceiptIcon, ['expense', 'scan']),
        go('settings', 'Settings', GearSixIcon, ['preferences']),
      ],
    },
    {
      label: 'Go to',
      items: [
        go('overview', 'Overview', HouseIcon, ['dashboard', 'home']),
        go('invoices', 'Invoices', ReceiptIcon, ['receivables', 'sales', 'AR']),
        go('customers', 'Customers', UsersThreeIcon, ['clients', 'debtors']),
        go('credit-notes', 'Credit notes', ReceiptIcon, ['refund', 'corrections']),
        go('banking', 'Banking', BankIcon, ['transactions', 'reconcile']),
        go('payables', 'Payables', WalletIcon, ['bills', 'suppliers', 'AP']),
        go('expenses', 'Expenses', ArrowsLeftRightIcon, ['receipts', 'claims']),
        go('journal', 'Journal', BookOpenTextIcon, ['ledger', 'entries']),
        go('accounts', 'Chart of accounts', BookOpenTextIcon, ['ledger', 'accounts']),
        go('reports', 'Reports', ChartLineUpIcon, ['profit', 'loss', 'balance sheet']),
      ],
    },
  ];
}

/**
 * The finance app frame the templates start from: sidebar, header with breadcrumb, search and
 * account, the command menu, and real blocks in the page. `?collapsed=1` starts on the icon rail;
 * `?motion=on` swaps in the motioned menus, popover, tabs and blocks.
 */
export function ShellPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const { collapsed: startCollapsed, locale } = readParams(window.location.search);
  const canvas = usePageCanvas(theme, mode);
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const [log, setLog] = useState<string | null>(null);
  const blocks = motion ? movingBlocks : plainBlocks;
  const MenuContent = motion ? movingNav.MenuContent : PlainMenuContent;
  const PopoverContent = motion ? movingNav.PopoverContent : PlainPopoverContent;
  const TabsList = motion ? movingNav.TabsList : PlainTabsList;
  const TabsPanel = motion ? movingNav.TabsPanel : PlainTabsPanel;

  const [commands] = useState(() => buildCommands(setLog));
  // The shortcuts the menus advertise are the app's to bind.
  useShortcut('mod+i', () => {
    setLog('New invoice');
  });

  const sidebar = (
    <Sidebar label="Main">
      <SidebarHeader>
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-control bg-accent text-sm font-semibold text-accent-contrast"
        >
          F
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium in-data-collapsed:sr-only">
          Fernhill Systems
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem href="#overview" icon={icon(HouseIcon)}>
            Overview
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Money in">
          <SidebarSubmenu label="Receivables" icon={icon(ReceiptIcon)} active defaultOpen>
            <SidebarSubItem href="#invoices" active badge={12}>
              Invoices
            </SidebarSubItem>
            <SidebarSubItem href="#customers">Customers</SidebarSubItem>
            <SidebarSubItem href="#credit-notes">Credit notes</SidebarSubItem>
          </SidebarSubmenu>
          <SidebarItem href="#banking" icon={icon(BankIcon)}>
            Banking
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Money out">
          <SidebarItem href="#payables" icon={icon(WalletIcon)} badge={4}>
            Payables
          </SidebarItem>
          <SidebarItem href="#expenses" icon={icon(ArrowsLeftRightIcon)}>
            Expenses
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Books">
          <SidebarSubmenu label="Ledger" icon={icon(BookOpenTextIcon)}>
            <SidebarSubItem href="#journal">Journal</SidebarSubItem>
            <SidebarSubItem href="#accounts">Chart of accounts</SidebarSubItem>
          </SidebarSubmenu>
          <SidebarItem href="#reports" icon={icon(ChartLineUpIcon)}>
            Reports
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem href="#settings" icon={icon(GearSixIcon)}>
          Settings
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );

  const header = (
    <AppShellHeader
      title={
        <Breadcrumb
          items={[
            { label: 'Fernhill Systems', href: '#overview' },
            { label: 'Receivables', href: '#receivables' },
            { label: 'Invoices' },
          ]}
        />
      }
      actions={
        <>
          <CommandMenuTrigger />
          <Notifications PopoverContent={PopoverContent} />
          <Menu>
            <MenuTrigger
              render={
                <Button variant="ghost" iconOnly aria-label="Account, Niamh Walsh">
                  {icon(UserCircleIcon)}
                </Button>
              }
            />
            <MenuContent align="end">
              <MenuGroup label="Niamh Walsh">
                <MenuItem icon={icon(UserCircleIcon)}>Profile</MenuItem>
                <MenuItem icon={icon(GearSixIcon)}>Settings</MenuItem>
                <MenuItem icon={icon(MoonIcon)}>Appearance</MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuItem icon={icon(SignOutIcon)} tone="danger">
                Sign out
              </MenuItem>
            </MenuContent>
          </Menu>
        </>
      }
    />
  );

  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode}>
      <CommandMenu groups={commands}>
        <AppShell
          sidebar={sidebar}
          header={header}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          mainClassName="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl font-heading tracking-tight">Invoices</h1>
              <p className="text-sm text-fg-muted" aria-live="polite">
                {log ?? 'March 2026, 42 invoices'}
              </p>
            </div>
            <Button>
              {icon(FilePlusIcon)}
              New invoice
            </Button>
          </div>
          <Tabs defaultValue="invoices">
            <TabsList aria-label="Receivables">
              <TabsTab value="invoices" hint={42}>
                Invoices
              </TabsTab>
              <TabsTab value="credit-notes" hint={3}>
                Credit notes
              </TabsTab>
              <TabsTab value="recurring">Recurring</TabsTab>
            </TabsList>
            <TabsPanel value="invoices" className="flex flex-col gap-6 pt-6">
              <blocks.KpiRow
                currency={locale.currency}
                locale={locale.locale}
                kpis={data.kpis(locale.rate)}
                comparison="vs February"
                label="Key figures, March 2026"
              />
              <blocks.InvoiceList
                currency={locale.currency}
                locale={locale.locale}
                invoices={data.invoices(locale.rate)}
                today={data.TODAY}
                onOpenInvoice={(invoice) => {
                  setLog(`Opened ${invoice.number}`);
                }}
              />
            </TabsPanel>
            <TabsPanel value="credit-notes" className="pt-6 text-sm text-fg-muted">
              Three credit notes this quarter.
            </TabsPanel>
            <TabsPanel value="recurring" className="pt-6 text-sm text-fg-muted">
              No recurring invoices yet.
            </TabsPanel>
          </Tabs>
        </AppShell>
      </CommandMenu>
    </ThemeScope>
  );
}

const NOTIFICATIONS = [
  {
    id: 'n1',
    unread: true,
    title: 'Kestrel Analytics paid INV-2026-0121',
    detail: '€6,240.00 matched to the bank feed',
    time: '9 min ago',
    href: '#invoices',
  },
  {
    id: 'n2',
    unread: true,
    title: 'Two bills from Nordwind Logistik are due Friday',
    detail: '€4,180.00 in total, waiting for approval',
    time: '1 h ago',
    href: '#payables',
  },
  {
    id: 'n3',
    unread: false,
    title: 'February closed by Piotr Nowak',
    detail: 'Journal locked, reports ready',
    time: 'Yesterday',
    href: '#reports',
  },
];

/** The bell: a count on the trigger, a short list of what changed, and a way to the full list. */
function Notifications({ PopoverContent }: { PopoverContent: typeof PlainPopoverContent }) {
  const [read, setRead] = useState(false);
  const unread = read ? 0 : NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            iconOnly
            aria-label={unread === 0 ? 'Notifications' : `Notifications, ${String(unread)} new`}
            className="relative"
          >
            {icon(BellIcon)}
            {unread > 0 && (
              <span
                aria-hidden
                className="absolute end-2 top-2 size-2 rounded-full bg-accent ring-2 ring-surface-canvas"
              />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-88 max-w-(--available-width) p-0">
        <div className="flex items-baseline justify-between gap-4 px-4 pt-3 pb-2">
          <PopoverTitle>Notifications</PopoverTitle>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => {
              setRead(true);
            }}
            className="cursor-pointer rounded-control text-sm text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:text-fg-disabled disabled:no-underline"
          >
            Mark all read
          </button>
        </div>
        <ul className="flex flex-col border-t border-line">
          {NOTIFICATIONS.map((n) => (
            <li key={n.id} className="not-last:border-b not-last:border-line">
              <a
                href={n.href}
                className="flex gap-3 px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                <span
                  aria-hidden
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.unread && !read ? 'bg-accent' : 'bg-transparent'}`}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-fg">
                    {n.unread && !read && <span className="sr-only">New: </span>}
                    {n.title}
                  </span>
                  <span className="text-sm text-fg-muted">{n.detail}</span>
                  <span className="text-xs text-fg-subtle">{n.time}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-2.5">
          <a
            href="#notifications"
            className="text-sm font-medium text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            View all notifications
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
