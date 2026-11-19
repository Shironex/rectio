'use client';

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@rectio/ui';

export default function CollapsibleDemo() {
  return (
    <Collapsible className="w-64">
      <CollapsibleTrigger>Lines behind the total</CollapsibleTrigger>
      <CollapsiblePanel>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-fg-muted">Net</dt>
          <dd className="text-end numeric">1,240.00</dd>
          <dt className="text-fg-muted">VAT 23%</dt>
          <dd className="text-end numeric">285.20</dd>
        </dl>
      </CollapsiblePanel>
    </Collapsible>
  );
}
