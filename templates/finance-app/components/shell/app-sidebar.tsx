'use client';

import {
  BookOpenTextIcon,
  ChartLineUpIcon,
  CreditCardIcon,
  FileTextIcon,
  GearSixIcon,
  HouseIcon,
} from '@phosphor-icons/react';
import { invoiceState } from '@rectio/blocks';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarSubItem,
  SidebarSubmenu,
} from '@rectio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { COMPANY, TODAY } from '@/data/company';
import { INVOICES } from '@/data/invoices';
import { usePageState, useQueryParam } from '../use-page-state';
import { useAppData } from './app-data';
import { icon } from './icon';

const overdueCount = INVOICES.filter((i) => invoiceState(i, TODAY) === 'overdue').length;

/** A count with its meaning in words, so the number never stands alone. */
function CountBadge({ count, label, urgent }: { count: number; label: string; urgent: boolean }) {
  return (
    <span className={urgent ? 'font-medium text-negative-strong' : undefined}>
      {count} {label}
    </span>
  );
}

/** The product mark: the company initial on the accent, and the name beside it. */
export function CompanyMark({ hideNameWhenCollapsed = true }: { hideNameWhenCollapsed?: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-control bg-accent text-sm font-strong text-accent-contrast"
      >
        {COMPANY.initial}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-sm font-medium ${hideNameWhenCollapsed ? 'in-data-collapsed:sr-only' : ''}`}
      >
        {COMPANY.name}
      </span>
    </>
  );
}

/** The main navigation: every page of the app, grouped the way a finance team thinks of them. */
export function AppSidebar() {
  const pathname = usePathname();
  const account = useQueryParam('account');
  const { expenses } = useAppData();
  // An empty account has nothing overdue or waiting, so the counts follow ?state=empty too.
  const empty = usePageState() === 'empty';
  const pending = empty ? 0 : expenses.requests.filter((r) => r.status === 'pending').length;
  const overdue = empty ? 0 : overdueCount;
  const on = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));
  const onJournal = on('/journal');

  return (
    <Sidebar label="Main">
      <SidebarHeader>
        <CompanyMark />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem render={<Link href="/" />} icon={icon(HouseIcon)} active={on('/')}>
            Overview
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Money in">
          <SidebarItem
            render={<Link href="/invoices" />}
            icon={icon(FileTextIcon)}
            active={on('/invoices')}
            {...(overdue > 0
              ? { badge: <CountBadge count={overdue} label="overdue" urgent /> }
              : {})}
          >
            Invoices
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Money out">
          <SidebarItem
            render={<Link href="/expenses" />}
            icon={icon(CreditCardIcon)}
            active={on('/expenses')}
            {...(pending > 0
              ? { badge: <CountBadge count={pending} label="waiting" urgent={false} /> }
              : {})}
          >
            Expenses
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Books">
          <SidebarSubmenu
            label="Ledger"
            icon={icon(BookOpenTextIcon)}
            active={onJournal}
            defaultOpen
          >
            <SidebarSubItem
              render={<Link href="/journal" />}
              active={onJournal && account === null}
            >
              Journal
            </SidebarSubItem>
            <SidebarSubItem
              render={<Link href="/journal?account=1000" />}
              active={onJournal && account === '1000'}
            >
              Bank account
            </SidebarSubItem>
            <SidebarSubItem
              render={<Link href="/journal?account=1100" />}
              active={onJournal && account === '1100'}
            >
              Trade debtors
            </SidebarSubItem>
          </SidebarSubmenu>
          <SidebarItem
            render={<Link href="/reports" />}
            icon={icon(ChartLineUpIcon)}
            active={on('/reports')}
          >
            Reports
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem
          render={<Link href="/settings" />}
          icon={icon(GearSixIcon)}
          active={on('/settings')}
        >
          Settings
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}
