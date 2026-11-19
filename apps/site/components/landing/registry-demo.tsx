'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState, type ReactNode } from 'react';

import { INVOICES, TODAY } from '@/demos/finance-data';

import { Terminal } from './terminal';

// The block mounts only once the session has typed out, so its code loads then, not with the page.
const InvoiceList = dynamic(() => import('@rectio/blocks/motion').then((m) => m.InvoiceList));

/**
 * The CLI adds a block, and the block appears: once the terminal session has finished, the invoice
 * list mounts beside it with its motion entrance. The slot keeps its height before, so nothing
 * below moves. Under reduced motion the session is complete at once and the block renders plain.
 */
export function RegistryDemo({ notes }: { notes?: ReactNode }) {
  const [added, setAdded] = useState(false);
  const onDone = useCallback(() => {
    setAdded(true);
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
      <div className="flex min-w-0 flex-col gap-8 xl:col-span-4">
        <Terminal onDone={onDone} />
        {notes}
      </div>
      <div className="relative min-h-112 min-w-0 xl:col-span-8">
        {added ? (
          <InvoiceList
            invoices={INVOICES}
            currency="EUR"
            locale="en-GB"
            today={TODAY}
            defaultPeriod="all"
          />
        ) : (
          // A skeleton in the block's own shape, waiting for the file the session writes.
          <div
            aria-hidden
            className="flex h-112 flex-col gap-5 rounded-panel border border-dashed border-line-strong p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="h-4 w-24 rounded-badge bg-surface-inset" />
                <span className="h-3 w-32 rounded-badge bg-surface-inset" />
              </div>
              <code className="font-mono text-sm text-fg-muted">invoice-list.tsx</code>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-20 rounded-control bg-surface-inset" />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-9 rounded-control bg-surface-inset" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
