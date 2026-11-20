'use client';

import {
  BellIcon,
  BuildingsIcon,
  CodeIcon,
  CreditCardIcon,
  FolderSimpleIcon,
  GearSixIcon,
  HouseIcon,
  KanbanIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
} from '@rectio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { WORKSPACE } from '@/data/workspace';
import { usePageState } from '../use-page-state';
import { useAppData } from './app-data';
import { icon } from './icon';

/** A count with its meaning in words, so the number never stands alone. */
function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span className="font-medium text-fg-muted numeric">
      {count} {label}
    </span>
  );
}

/** The workspace mark: its initial on the accent, and the name beside it. */
export function WorkspaceMark({
  hideNameWhenCollapsed = true,
}: {
  hideNameWhenCollapsed?: boolean;
}) {
  return (
    <>
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-control bg-accent text-sm font-strong text-accent-contrast"
      >
        {WORKSPACE.initial}
      </span>
      <span
        className={`flex min-w-0 flex-1 flex-col leading-tight ${hideNameWhenCollapsed ? 'in-data-collapsed:sr-only' : ''}`}
      >
        <span className="truncate text-sm font-medium">{WORKSPACE.name}</span>
        <span className="truncate text-xs text-fg-muted">Support, {WORKSPACE.plan} plan</span>
      </span>
    </>
  );
}

/** The main navigation: the desk first, then the people, then the account. */
export function AppSidebar() {
  const pathname = usePathname();
  const { tickets, notifications } = useAppData();
  // An empty workspace has nothing new or unread, so the counts follow ?state=empty too.
  const empty = usePageState() === 'empty';
  const fresh = empty ? 0 : tickets.filter((t) => t.columnId === 'new').length;
  const unread = empty ? 0 : notifications.filter((n) => !n.read).length;
  const on = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));
  const onSettings = on('/settings');

  return (
    <Sidebar label="Main">
      <SidebarHeader>
        <WorkspaceMark />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem render={<Link href="/" />} icon={icon(HouseIcon)} active={on('/')}>
            Overview
          </SidebarItem>
          <SidebarItem
            render={<Link href="/tickets" />}
            icon={icon(KanbanIcon)}
            active={on('/tickets')}
            {...(fresh > 0 ? { badge: <CountBadge count={fresh} label="new" /> } : {})}
          >
            Tickets
          </SidebarItem>
          <SidebarItem
            render={<Link href="/customers" />}
            icon={icon(BuildingsIcon)}
            active={on('/customers')}
          >
            Customers
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Workspace">
          <SidebarItem
            render={<Link href="/team" />}
            icon={icon(UsersThreeIcon)}
            active={on('/team')}
          >
            Team
          </SidebarItem>
          <SidebarItem
            render={<Link href="/files" />}
            icon={icon(FolderSimpleIcon)}
            active={on('/files')}
          >
            Files
          </SidebarItem>
          <SidebarItem
            render={<Link href="/notifications" />}
            icon={icon(BellIcon)}
            active={on('/notifications')}
            {...(unread > 0 ? { badge: <CountBadge count={unread} label="unread" /> } : {})}
          >
            Notifications
          </SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Account">
          <SidebarItem
            render={<Link href="/billing" />}
            icon={icon(CreditCardIcon)}
            active={on('/billing')}
          >
            Billing
          </SidebarItem>
          <SidebarItem
            render={<Link href="/developers" />}
            icon={icon(CodeIcon)}
            active={on('/developers')}
          >
            API keys
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem
          render={<Link href="/settings" />}
          icon={icon(GearSixIcon)}
          active={onSettings}
        >
          Settings
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}
