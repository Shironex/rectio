'use client';

import { Anchor, Breadcrumb, LinkProvider, type LinkRenderProps } from '@rectio/ui';
import { useState } from 'react';

/**
 * A stand-in router: it keeps the docs page in place and names the page it would open, the way
 * Next's Link would change pages on the client under its base path.
 */
export default function LinkDemo() {
  const [opened, setOpened] = useState<string | undefined>(undefined);
  const render = ({ href, onClick, ...props }: LinkRenderProps) => (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        setOpened(href);
      }}
      {...props}
    />
  );
  return (
    <LinkProvider render={render}>
      <div className="flex w-full max-w-md flex-col gap-5">
        <Breadcrumb
          items={[
            { label: 'Customers', href: '/customers' },
            { label: 'Hale & Sons', href: '/customers/hale-sons' },
            { label: 'Invoices' },
          ]}
          collapseOnPhone={false}
        />
        <p className="text-sm text-fg-muted">
          Read the{' '}
          <Anchor href="/docs/billing" className="font-medium text-fg underline underline-offset-4">
            billing guide
          </Anchor>{' '}
          or the{' '}
          <Anchor
            href="https://example.com/status"
            external
            className="font-medium text-fg underline underline-offset-4"
          >
            status page
          </Anchor>
          .
        </p>
        <p
          aria-live="polite"
          className="rounded-control border border-line bg-surface-sunken px-3 py-2 font-mono text-sm text-fg-muted"
        >
          {opened === undefined ? 'Press a link: the router takes it.' : `router.push('${opened}')`}
        </p>
      </div>
    </LinkProvider>
  );
}
