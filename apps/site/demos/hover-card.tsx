'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger, Money } from '@rectio/ui';
import type { MouseEvent } from 'react';

const stay = (event: MouseEvent) => {
  event.preventDefault();
};

export default function HoverCardDemo() {
  return (
    <p className="max-w-sm text-sm text-fg-muted">
      Invoice 2041 was issued to{' '}
      <HoverCard>
        <HoverCardTrigger href="#kowalski-sons" onClick={stay}>
          Kowalski &amp; Sons sp. z o.o.
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-medium text-fg">Kowalski &amp; Sons sp. z o.o.</span>
            <span className="text-sm text-fg-muted">Warsaw, Poland. Net 30 terms.</span>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-fg-subtle">Open balance</dt>
              <dd>
                <Money amount={18_420} currency="PLN" locale="en-GB" tone="neutral" />
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Open invoices</dt>
              <dd className="numeric text-fg">3</dd>
            </div>
          </dl>
        </HoverCardContent>
      </HoverCard>{' '}
      on 12 March.
    </p>
  );
}
