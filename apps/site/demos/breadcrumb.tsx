'use client';

import { Breadcrumb, type BreadcrumbLinkProps } from '@rectio/ui';
import type { MouseEvent } from 'react';

const ITEMS = [
  { label: 'Receivables', href: '#receivables' },
  { label: 'Customers', href: '#customers' },
  { label: 'Kowalski & Sons', href: '#kowalski-sons' },
  { label: 'Invoices', href: '#invoices' },
  { label: 'Invoice 2041' },
] as const;

const stay = (event: MouseEvent) => {
  event.preventDefault();
};

/** The docs page must not jump on a click; in an app this is your router's link. */
const renderLink = ({ href, className, children }: BreadcrumbLinkProps) => (
  <a href={href} className={className} onClick={stay}>
    {children}
  </a>
);

export default function BreadcrumbDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Breadcrumb items={ITEMS.slice(0, 3)} renderLink={renderLink} />
      <Breadcrumb items={ITEMS} maxItems={4} renderLink={renderLink} />
    </div>
  );
}
