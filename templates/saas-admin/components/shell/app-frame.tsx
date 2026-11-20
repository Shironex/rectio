'use client';

import { NotificationsCenter } from '@rectio/blocks/motion';
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
  TooltipProvider,
  useShortcut,
  type BreadcrumbItem,
} from '@rectio/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';

import { customerById } from '@/data/customers';
import { LOCALE, NOW, WORKSPACE } from '@/data/workspace';
import { setAppearance, useAppearance, useDarkMode } from '../use-appearance';
import { usePageState } from '../use-page-state';
import { AppDataProvider, useAppData } from './app-data';
import { AppSidebar } from './app-sidebar';
import { buildCommands } from './commands';
import { AccountMenu, AppearanceMenu } from './header-menus';
import { SECTIONS, SETTINGS_SECTIONS } from './sections';

/** The trail for a path: the workspace, the section, and the record or sub-page when there is one. */
function breadcrumbFor(pathname: string): BreadcrumbItem[] {
  const [section, record] = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: WORKSPACE.name, href: '/' }];
  if (section === undefined) return [...items, { label: 'Overview' }];
  const label = SECTIONS[section] ?? section;
  if (record === undefined) return [...items, { label }];
  const name =
    section === 'customers'
      ? (customerById(record)?.name ?? record)
      : (SETTINGS_SECTIONS.find((s) => s.href === pathname)?.label ?? record);
  return [...items, { label, href: `/${section}` }, { label: name }];
}

const SHORTCUTS = [
  { keys: 'mod+k', label: 'Search pages and actions' },
  { keys: 'mod+b', label: 'Fold or unfold the sidebar' },
  { keys: 'mod+i', label: 'New ticket' },
] as const;

function HeaderNotifications() {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useAppData();
  // An empty workspace has nothing unread, as the sidebar shows.
  const empty = usePageState() === 'empty';
  return (
    <NotificationsCenter
      notifications={empty ? [] : notifications}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
      onOpen={() => {
        router.push('/notifications');
      }}
      settings={() => {
        router.push('/settings/notifications');
      }}
      now={NOW}
      locale={LOCALE}
    />
  );
}

function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { openNewTicket } = useAppData();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const dark = useDarkMode();
  const ledger = useAppearance().theme === 'ledger';

  const commands = useMemo(
    () =>
      buildCommands({
        go: (href) => {
          router.push(href);
        },
        newTicket: () => {
          openNewTicket();
        },
        toggleTheme: () => {
          setAppearance({
            theme: document.documentElement.dataset.theme === 'ledger' ? 'default' : 'ledger',
          });
        },
        setMode: (mode) => {
          setAppearance({ mode });
        },
        dark,
        ledger,
      }),
    [router, openNewTicket, dark, ledger],
  );

  // The shortcut the command menu advertises is the app's to bind.
  useShortcut('mod+i', () => {
    openNewTicket();
  });

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
          <HeaderNotifications />
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
      <TooltipProvider>
        <AppDataProvider>
          <Frame>{children}</Frame>
        </AppDataProvider>
      </TooltipProvider>
    </ToastProvider>
  );
}
