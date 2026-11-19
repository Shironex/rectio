'use client';

import { BankIcon, BookOpenIcon, HouseIcon, ReceiptIcon } from '@phosphor-icons/react';
import {
  AppShell,
  AppShellHeader,
  Breadcrumb,
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  type BreadcrumbLinkProps,
} from '@rectio/ui';
import type { MouseEvent } from 'react';

const stay = (event: MouseEvent) => {
  event.preventDefault();
};

const renderLink = ({ href, className, children }: BreadcrumbLinkProps) => (
  <a href={href} className={className} onClick={stay}>
    {children}
  </a>
);

export default function AppShellDemo() {
  return (
    <AppShell
      className="h-96 min-h-0 w-full overflow-y-auto rounded-panel border border-line"
      sidebar={
        <Sidebar className="h-full">
          <SidebarHeader>
            <span className="truncate font-display text-lg text-fg">Harbour &amp; Finch</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarItem href="#overview" icon={<HouseIcon />} onClick={stay}>
                Overview
              </SidebarItem>
              <SidebarItem href="#receivables" icon={<ReceiptIcon />} active onClick={stay}>
                Receivables
              </SidebarItem>
              <SidebarItem href="#payables" icon={<BankIcon />} badge={4} onClick={stay}>
                Payables
              </SidebarItem>
              <SidebarItem href="#ledger" icon={<BookOpenIcon />} onClick={stay}>
                General ledger
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      }
      header={
        <AppShellHeader
          title={
            <Breadcrumb
              items={[{ label: 'Receivables', href: '#receivables' }, { label: 'Invoices' }]}
              renderLink={renderLink}
            />
          }
          actions={<Button size="sm">New invoice</Button>}
        />
      }
      mainClassName="p-4"
    >
      <h2 className="font-display text-xl text-fg">Invoices</h2>
      <p className="mt-1 text-sm text-fg-muted">
        The header sticks to the top while the page scrolls. Press Tab once to reach the skip link.
      </p>
    </AppShell>
  );
}
