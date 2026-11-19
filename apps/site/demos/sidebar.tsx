'use client';

import { BankIcon, BookOpenIcon, HouseIcon, PercentIcon, ReceiptIcon } from '@phosphor-icons/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarProvider,
  SidebarSubItem,
  SidebarSubmenu,
  SidebarTrigger,
  TooltipProvider,
} from '@rectio/ui';
import { useState, type MouseEvent } from 'react';

const PAGES: Record<string, string> = {
  overview: 'Overview',
  invoices: 'Invoices',
  customers: 'Customers',
  payables: 'Payables',
  ledger: 'General ledger',
  vat: 'VAT returns',
};

export default function SidebarDemo() {
  const [page, setPage] = useState('invoices');
  // The docs page must not jump on a click; in an app these are your router's links.
  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    setPage(id);
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-96 w-full overflow-hidden rounded-panel border border-line">
          <Sidebar label="Main" className="h-full">
            <SidebarHeader>
              <span className="truncate font-display text-lg text-fg">Harbour &amp; Finch</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup label="Finance">
                <SidebarItem
                  href="#overview"
                  icon={<HouseIcon />}
                  active={page === 'overview'}
                  onClick={go('overview')}
                >
                  Overview
                </SidebarItem>
                <SidebarSubmenu
                  label="Receivables"
                  icon={<ReceiptIcon />}
                  active={page === 'invoices' || page === 'customers'}
                >
                  <SidebarSubItem
                    href="#invoices"
                    active={page === 'invoices'}
                    onClick={go('invoices')}
                  >
                    Invoices
                  </SidebarSubItem>
                  <SidebarSubItem
                    href="#customers"
                    active={page === 'customers'}
                    onClick={go('customers')}
                  >
                    Customers
                  </SidebarSubItem>
                </SidebarSubmenu>
                <SidebarItem
                  href="#payables"
                  icon={<BankIcon />}
                  badge={4}
                  active={page === 'payables'}
                  onClick={go('payables')}
                >
                  Payables
                </SidebarItem>
              </SidebarGroup>
              <SidebarGroup label="Reports">
                <SidebarItem
                  href="#ledger"
                  icon={<BookOpenIcon />}
                  active={page === 'ledger'}
                  onClick={go('ledger')}
                >
                  General ledger
                </SidebarItem>
                <SidebarItem
                  href="#vat"
                  icon={<PercentIcon />}
                  active={page === 'vat'}
                  onClick={go('vat')}
                >
                  VAT returns
                </SidebarItem>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <span className="truncate px-2 text-xs text-fg-subtle">Ctrl or Cmd B folds it</span>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="bg-surface-canvas">
            <div className="flex h-(--rx-app-shell-header-height) items-center gap-2 border-b border-line px-3">
              <SidebarTrigger />
              <span className="text-sm font-medium text-fg">{PAGES[page]}</span>
            </div>
            <p className="p-4 text-sm text-fg-muted">Fold the sidebar to see the icon rail.</p>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
