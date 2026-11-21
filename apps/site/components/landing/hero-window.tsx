import {
  ChartLineIcon,
  CheckSquareIcon,
  FileTextIcon,
  ReceiptIcon,
  BookOpenIcon,
  CheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Badge, Money } from '@rectio/ui';

import { HeroApprovals, HeroInvoiceList } from './parts';

const NAV = [
  { label: 'Overview', icon: ChartLineIcon },
  { label: 'Invoices', icon: FileTextIcon, current: true },
  { label: 'Expenses', icon: ReceiptIcon },
  { label: 'Approvals', icon: CheckSquareIcon },
  { label: 'Ledger', icon: BookOpenIcon },
] as const;

/**
 * The hero's product window: the real invoice list and expense approval blocks inside a finance
 * app's frame. It is a picture of the kit, so it is inert: the live, focusable versions are in the
 * bench further down. CSS settles it flat as the page scrolls.
 */
export function HeroWindow() {
  return (
    <figure className="site-window relative mx-auto w-full max-w-7xl px-4 sm:px-8">
      <figcaption className="sr-only">
        The invoice list and expense approval blocks, composed into a finance app.
      </figcaption>
      <div
        inert
        className="overflow-hidden rounded-panel border border-line-strong bg-surface-canvas shadow-overlay"
      >
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
          <span className="text-sm font-strong text-fg">Fernhill Systems</span>
          <span className="text-sm text-fg-subtle">/</span>
          <span className="text-sm text-fg-muted">Finance, March 2026</span>
        </div>
        <div className="flex max-h-176 overflow-hidden sm:max-h-208">
          <nav className="hidden w-48 shrink-0 flex-col gap-0.5 border-e border-line bg-surface p-3 lg:flex">
            {NAV.map(({ label, icon: Icon, ...item }) => (
              <span
                key={label}
                className={`flex h-8 items-center gap-2.5 rounded-control px-2.5 text-sm ${'current' in item ? 'bg-surface-selected font-medium text-fg' : 'text-fg-muted'}`}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </span>
            ))}
          </nav>
          <div className="grid min-w-0 flex-1 items-start gap-4 p-3 sm:p-5 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <HeroInvoiceList />
            </div>
            <div className="hidden min-w-0 xl:col-span-4 xl:block">
              <HeroApprovals />
            </div>
          </div>
        </div>
        {/* A status bar closes the frame: the pane above is clipped by it, as a scrolled app pane
            is, instead of fading out through a row of text. */}
        <div className="flex items-center justify-end gap-6 border-t border-line bg-surface px-4 py-2.5">
          <span className="text-sm text-fg-muted">Bank feed synced, 16 Mar</span>
          <span className="hidden text-sm text-fg-muted sm:inline">4 open, 2 overdue</span>
        </div>
      </div>

      {/* Two cards from the same books float over the window's edges, as if lifted out of it. */}
      <div
        aria-hidden
        className="absolute -bottom-8 start-0 hidden w-72 flex-col gap-2 rounded-panel border border-line-strong bg-surface-raised p-4 shadow-overlay md:flex xl:-start-6"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-fg-muted">Reconciled, March</span>
          <Badge tone="positive">Matched 4 of 4</Badge>
        </div>
        <Money
          amount={-1104.3}
          currency="EUR"
          locale="en-IE"
          className="font-display text-3xl font-heading text-fg"
        />
        <span className="text-sm text-fg-muted">Difference €0.00</span>
      </div>
      <div
        aria-hidden
        className="absolute -top-6 end-0 hidden w-64 items-start gap-3 rounded-panel border border-line-strong bg-surface-raised p-3 shadow-overlay xl:flex xl:-end-10"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-positive-subtle text-positive-strong">
          <CheckIcon weight="bold" className="size-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-strong text-fg">Hotel Bristol approved</span>
          <span className="text-sm text-fg-muted">Clara Hughes, 16 Mar</span>
        </span>
      </div>
    </figure>
  );
}
