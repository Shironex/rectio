'use client';

import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@rectio/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import ExpenseApprovalDemo from '@/demos/expense-approval';
import InvoiceListDemo from '@/demos/invoice-list';
import LedgerDemo from '@/demos/ledger';

import { ExpenseReport } from './expense-report';
import { readDuration, useReducedMotion } from './motion-tokens';

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
        <Tabs.List
          aria-label="Live blocks"
          className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-line sm:grid-cols-4"
        >
          {TABS.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className={cn(
                'group relative flex cursor-pointer flex-col items-start gap-1 pt-2 pb-4 text-start',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              )}
            >
              <span className="text-lg font-strong text-fg-muted transition-colors duration-fast ease-standard group-data-active:text-fg pointer-fine:group-hover:text-fg">
                {t.label}
              </span>
              <span className="hidden text-sm text-fg-subtle md:block">{t.note}</span>
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
