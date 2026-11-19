'use client';

import { InvoiceList } from '@rectio/blocks/motion';
import { useCallback, useState } from 'react';

import { INVOICES, TODAY } from '@/demos/finance-data';

import { Terminal } from './terminal';

/**
 * The CLI adds a block, and the block appears: once the terminal session has finished, the invoice
 * list mounts beside it with its motion entrance. The slot keeps its height before, so nothing
 * below moves. Under reduced motion the session is complete at once and the block renders plain.
 */
export function RegistryDemo() {
  const [added, setAdded] = useState(false);
  const onDone = useCallback(() => {
    setAdded(true);
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
      <div className="min-w-0 xl:col-span-4">
        <Terminal onDone={onDone} />
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
          <div
            aria-hidden
            className="flex h-112 items-center justify-center rounded-panel border border-dashed border-line-strong"
          >
            <code className="font-mono text-sm text-fg-subtle">invoice-list.tsx</code>
          </div>
        )}
      </div>
    </div>
  );
}
