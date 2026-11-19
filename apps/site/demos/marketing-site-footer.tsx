'use client';

import { SiteFooter } from '@rectio/blocks/marketing';

export default function SiteFooterDemo() {
  return (
    <div className="w-full">
      <SiteFooter
        brand="Northlake"
        brandLabel="Northlake home"
        tagline="Finance, in one place."
        columns={[
          {
            id: 'product',
            title: 'Product',
            links: [
              { label: 'Invoices', href: '#invoices' },
              { label: 'Approvals', href: '#approvals' },
            ],
          },
          {
            id: 'company',
            title: 'Company',
            links: [
              { label: 'About', href: '#about' },
              { label: 'Contact', href: '#contact' },
            ],
          },
        ]}
        legal={[
          { label: 'Privacy', href: '#privacy' },
          { label: 'Terms', href: '#terms' },
        ]}
        copyright="© 2026 Northlake Ltd"
      />
    </div>
  );
}
