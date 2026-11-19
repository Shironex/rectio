import {
  ChartLineIcon,
  CheckSquareIcon,
  FileTextIcon,
  ReceiptIcon,
  BookOpenIcon,
} from '@phosphor-icons/react/dist/ssr';

import ExpenseApprovalDemo from '@/demos/expense-approval';
import InvoiceListDemo from '@/demos/invoice-list';

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
              <InvoiceListDemo />
            </div>
            <div className="hidden min-w-0 xl:col-span-4 xl:block">
              <ExpenseApprovalDemo />
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
