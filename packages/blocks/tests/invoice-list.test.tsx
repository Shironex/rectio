import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InvoiceList, type InvoiceSummary } from '../src/index';

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const TODAY = d(3, 19);

const invoices: InvoiceSummary[] = [
  {
    id: 'a',
    number: 'INV-1',
    customer: 'Kestrel',
    issued: d(1, 10),
    due: d(3, 30),
    total: 500,
    status: 'sent',
  },
  {
    id: 'b',
    number: 'INV-2',
    customer: 'Atelier Lune',
    issued: d(3, 1),
    due: d(3, 5),
    total: 900,
    status: 'sent',
  },
  {
    id: 'c',
    number: 'INV-3',
    customer: 'Borowik',
    issued: d(2, 2),
    due: d(3, 20),
    total: 300,
    status: 'paid',
  },
];

const base = {
  invoices,
  currency: 'EUR',
  locale: 'en-GB',
  today: TODAY,
  defaultPeriod: 'all' as const,
};

/** Invoice numbers in the order the table shows them. */
const order = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .flatMap((row) =>
      within(row)
        .queryAllByText(/^INV-\d$/)
        .slice(0, 1),
    )
    .map((cell) => cell.textContent);

describe('InvoiceList sort', () => {
  it('opens on the due date, soonest first', () => {
    render(<InvoiceList {...base} />);
    expect(order()).toEqual(['INV-2', 'INV-3', 'INV-1']);
  });

  it('opens in the order defaultSort asks for', () => {
    render(<InvoiceList {...base} defaultSort={{ column: 'issued' }} />);
    expect(order()).toEqual(['INV-1', 'INV-3', 'INV-2']);
  });

  it('sorts by amount, largest first', () => {
    render(<InvoiceList {...base} defaultSort={{ column: 'amount', desc: true }} />);
    expect(order()).toEqual(['INV-2', 'INV-1', 'INV-3']);
  });
});

describe('InvoiceList filter', () => {
  it('follows a controlled filter without remounting', () => {
    const { rerender } = render(<InvoiceList {...base} filter="paid" />);
    expect(order()).toEqual(['INV-3']);
    rerender(<InvoiceList {...base} filter="overdue" />);
    expect(order()).toEqual(['INV-2']);
  });

  it('reports the pick and waits for the app', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<InvoiceList {...base} filter="paid" onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button', { name: /Overdue/ }));
    expect(onFilterChange).toHaveBeenCalledWith('overdue');
    expect(order()).toEqual(['INV-3']);
  });
});
