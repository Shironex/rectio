'use client';

import { Badge, Money, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@rectio/ui';

const INVOICES = [
  { id: '2041', customer: 'Nordlicht GmbH', amount: 2374.6, status: 'Sent' },
  { id: '2040', customer: 'Kestrel Logistics', amount: 918, status: 'Paid' },
  { id: '2039', customer: 'Halden Print Works', amount: 4120.25, status: 'Overdue' },
  { id: '2038', customer: 'Brightwater Studio', amount: 655, status: 'Paid' },
] as const;

/** An invoice list beside the open invoice. Drag the line, or focus it and use the arrow keys. */
export default function ResizableDemo() {
  return (
    <div className="h-80 w-full overflow-hidden rounded-panel border border-line bg-surface">
      <ResizablePanelGroup storageKey="docs-invoices">
        <ResizablePanel id="docs-invoice-list" defaultSize={38} minSize={25} maxSize={60}>
          <ul className="flex flex-col divide-y divide-line text-sm">
            {INVOICES.map((invoice) => (
              <li
                key={invoice.id}
                data-current={invoice.id === '2041' || undefined}
                className="flex flex-col gap-0.5 px-4 py-2.5 data-current:bg-surface-selected"
              >
                <span className="truncate font-medium text-fg">{invoice.customer}</span>
                <span className="text-fg-muted numeric">Invoice {invoice.id}</span>
              </li>
            ))}
          </ul>
        </ResizablePanel>
        <ResizableHandle label="Resize the invoice list" withGrip />
        <ResizablePanel id="docs-invoice-detail" minSize={35}>
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-heading tracking-tight text-fg">
                Invoice 2041
              </h3>
              <Badge tone="info">Sent</Badge>
            </div>
            <p className="text-sm text-fg-muted">Nordlicht GmbH, issued 12 March, due 11 April.</p>
            <Money
              amount={2374.6}
              currency="EUR"
              locale="en-IE"
              tone="neutral"
              className="text-2xl"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
