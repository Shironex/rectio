'use client';

import {
  AppShell,
  AppShellHeader,
  Breadcrumb,
  CommandMenu,
  CommandMenuTrigger,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  KbdShortcut,
  ToastProvider,
  useShortcut,
  type BreadcrumbItem,
} from '@rectio/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';

import { COMPANY } from '@/data/company';
import { setAppearance, useDarkMode } from '../use-appearance';
import { AppDataProvider, useAppData } from './app-data';
import { AppSidebar } from './app-sidebar';
import { buildCommands } from './commands';
import { AccountMenu, AppearanceMenu, Notifications } from './header-menus';

const SECTIONS: Record<string, string> = {
  invoices: 'Invoices',
  expenses: 'Expenses',
  journal: 'Journal',
  reports: 'Reports',
  settings: 'Settings',
};

/** The trail for a path: the company, the section, and the record when there is one. */
function breadcrumbFor(pathname: string): BreadcrumbItem[] {
  const [section, record] = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: COMPANY.name, href: '/' }];
  if (section === undefined) return [...items, { label: 'Overview' }];
  const label = SECTIONS[section] ?? section;
  if (record === undefined) return [...items, { label }];
  return [...items, { label, href: `/${section}` }, { label: record.toUpperCase() }];
}

const SHORTCUTS = [
  { keys: 'mod+k', label: 'Search pages and actions' },
  { keys: 'mod+b', label: 'Fold or unfold the sidebar' },
  { keys: 'mod+i', label: 'New invoice' },
] as const;

function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { openNewInvoice, openSubmitExpense } = useAppData();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const dark = useDarkMode();

  const commands = useMemo(
    () =>
      buildCommands({
        go: (href) => {
          router.push(href);
        },
        newInvoice: openNewInvoice,
        submitExpense: openSubmitExpense,
        toggleTheme: () => {
          setAppearance({
            theme: document.documentElement.dataset.theme === 'ledger' ? 'default' : 'ledger',
          });
        },
        setMode: (mode) => {
          setAppearance({ mode });
        },
        dark,
      }),
    [router, openNewInvoice, openSubmitExpense, dark],
  );

  // The shortcut the command menu advertises is the app's to bind.
  useShortcut('mod+i', openNewInvoice);

  const header = (
    <AppShellHeader
      title={
        <Breadcrumb
          items={breadcrumbFor(pathname)}
          renderLink={({ href, className, children: label }) => (
            <Link href={href} className={className}>
              {label}
            </Link>
          )}
        />
      }
      actions={
        <>
          <CommandMenuTrigger />
          <AppearanceMenu className="max-sm:hidden" />
          <Notifications />
          <AccountMenu
            onShowShortcuts={() => {
              setShortcutsOpen(true);
            }}
          />
        </>
      }
    />
  );

  return (
    <CommandMenu groups={commands}>
      <AppShell
        sidebar={<AppSidebar />}
        header={header}
        mainClassName="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-8 sm:pt-8"
      >
        {children}
      </AppShell>
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <dl className="flex flex-col divide-y divide-line text-sm">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center justify-between gap-4 py-2.5">
                  <dt>{s.label}</dt>
                  <dd>
                    <KbdShortcut shortcut={s.keys} />
                  </dd>
                </div>
              ))}
            </dl>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </CommandMenu>
  );
}

/** The frame of every signed-in page: sidebar, header, command menu, toasts and shared state. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppDataProvider>
        <Frame>{children}</Frame>
      </AppDataProvider>
    </ToastProvider>
  );
}
