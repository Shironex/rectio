'use client';

import { SiteHeader } from '@rectio/blocks/marketing';

export default function SiteHeaderDemo() {
  return (
    <div className="w-full">
      <SiteHeader
        brand="Northlake"
        brandLabel="Northlake home"
        sticky={false}
        links={[
          { label: 'Product', href: '#product' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'Docs', href: '#docs' },
        ]}
        currentHref="#product"
        primary={{ label: 'Start free', href: '#start' }}
        secondary={{ label: 'Sign in', href: '#sign-in' }}
      />
    </div>
  );
}
