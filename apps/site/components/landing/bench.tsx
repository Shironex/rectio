'use client';

import { Tabs } from '@base-ui/react/tabs';
import { PauseIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import dynamic from 'next/dynamic';

import ExpenseApprovalDemo from '@/demos/expense-approval';
import InvoiceListDemo from '@/demos/invoice-list';

import { ExpenseReport } from './expense-report';
import { readDuration, useReducedMotion } from './motion-tokens';

// The ledger is the one block here not already on the page (the hero shows the invoice list and
// the approvals), so it loads when its tab first opens.
const LedgerDemo = dynamic(() => import('@/demos/ledger'));

const TABS: { value: string; label: string; note: string; panel: () => ReactNode }[] = [
  {
    value: 'expenses',
    label: 'Expenses',
    note: 'A report that takes new lines and recounts its total.',
    panel: () => <ExpenseReport />,
  },
  {
    value: 'invoices',
    label: 'Invoices',
    note: 'Outstanding, overdue and paid, with part payments shown in words.',
    panel: () => <InvoiceListDemo />,
  },
  {
    value: 'ledger',
    label: 'Ledger',
    note: 'The journal with a balance check, and each account with its running balance.',
    panel: () => <LedgerDemo />,
  },
  {
    value: 'approvals',
    label: 'Approvals',
    note: 'Approve or reject with a reason, in bulk, with an audit trail and undo.',
    panel: () => <ExpenseApprovalDemo />,
  },
];

/**
 * Live blocks in tabs that advance by themselves. Each tab shows its time left as a bar that
 * scales across (Web Animations, compositor only); at its end the next tab opens. Any pointer,
 * key or focus inside the bench stops the cycle for good: the visitor is using it now. It pauses
 * off screen, and reduced motion never starts it.
 */
export function Bench() {
  const [tab, setTab] = useState(TABS[0]?.value ?? '');
  const [cycling, setAuto] = useState(true);
  const reduced = useReducedMotion();
  const auto = cycling && !reduced;
  const root = useRef<HTMLDivElement>(null);
  const bars = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    const element = root.current;
    const bar = bars.current[tab];
    if (!auto || element === null || bar == null) return;
    const animation = bar.animate([{ scale: '0 1' }, { scale: '1 1' }], {
      duration: readDuration('--rx-motion-duration-loop', element) * 8,
      easing: 'linear',
    });
    animation.pause();
    animation.onfinish = () => {
      const index = TABS.findIndex((t) => t.value === tab);
      setTab(TABS[(index + 1) % TABS.length]?.value ?? tab);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true) animation.play();
        else animation.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      animation.onfinish = null;
      animation.cancel();
    };
  }, [auto, tab]);

  const stop = () => {
    if (auto) setAuto(false);
  };

  return (
    <div ref={root} onPointerDown={stop} onKeyDown={stop} onFocus={stop}>
      <Tabs.Root
        value={tab}
        onValueChange={(next) => {
          setTab(String(next));
        }}
        className="flex flex-col gap-6"
      >
        {/* The row keeps its height once the tour stops: a press on a tab stops the tour, and the
            tabs must not move between that press and its click. */}
        <div className="flex min-h-9 justify-end pointer-coarse:min-h-11">
          {auto && (
            <button
              type="button"
              onClick={stop}
              className="inline-flex min-h-9 items-center gap-2 rounded-control px-2 text-sm font-medium text-fg transition-colors duration-fast ease-standard pointer-coarse:min-h-11 pointer-fine:hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <PauseIcon aria-hidden weight="fill" className="size-3.5" />
              Stop the tour
            </button>
          )}
        </div>
        <Tabs.List
          aria-label="Live blocks"
          className="grid grid-cols-2 gap-x-2 gap-y-2 border-b border-line sm:grid-cols-4"
        >
          {TABS.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className={cn(
                // A real tab: the open one sits on a raised surface; the others light up on hover.
                'group relative flex cursor-pointer flex-col items-start gap-1 rounded-t-control px-3 pt-3 pb-4 text-start',
                'border border-b-0 border-line transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover data-active:border-line-strong data-active:bg-surface',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              )}
            >
              <span className="text-lg font-strong text-fg-muted transition-colors duration-fast ease-standard group-data-active:text-fg pointer-fine:group-hover:text-fg">
                {t.label}
              </span>
              <span className="hidden text-sm text-fg-muted md:block">{t.note}</span>
              <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-line" />
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent',
                  t.value === tab ? (auto ? 'scale-x-0' : 'scale-x-100') : 'scale-x-0',
                )}
                ref={(el) => {
                  bars.current[t.value] = el;
                }}
              />
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {TABS.map((t) => (
          <Tabs.Panel key={t.value} value={t.value} className="min-w-0 focus-visible:outline-none">
            {t.panel()}
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}
