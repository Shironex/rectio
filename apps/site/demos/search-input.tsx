'use client';

import { Field, FieldLabel, Money, SearchInput } from '@rectio/ui';
import { useState } from 'react';

const INVOICES = [
  { id: 'INV-2041', customer: 'Northwind Traders', amount: 4280 },
  { id: 'INV-2042', customer: 'Contoso Pharma', amount: 1175.5 },
  { id: 'INV-2043', customer: 'Fabrikam Logistics', amount: 9640 },
  { id: 'INV-2044', customer: 'Tailspin Air', amount: 312.4 },
];

export default function SearchInputDemo() {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const matches = INVOICES.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(needle) || invoice.customer.toLowerCase().includes(needle),
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Field>
        <FieldLabel>Search invoices</FieldLabel>
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Number or customer"
          shortcut="/"
          globalShortcut
        />
      </Field>
      <ul className="flex flex-col divide-y divide-line text-sm" aria-live="polite">
        {matches.map((invoice) => (
          <li key={invoice.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              <span className="text-fg-muted numeric">{invoice.id}</span> {invoice.customer}
            </span>
            <Money amount={invoice.amount} currency="EUR" locale="en-IE" />
          </li>
        ))}
        {matches.length === 0 && <li className="py-2 text-fg-muted">No invoices match.</li>}
      </ul>
    </div>
  );
}
