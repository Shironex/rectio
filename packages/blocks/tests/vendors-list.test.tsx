import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VendorsList, type Vendor } from '../src/index';
import { VendorsList as MotionVendorsList } from '../src/motion';

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const TODAY = d(3, 19);

const vendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Éclair Print Works',
    contact: 'Niall Keane',
    termsDays: 30,
    status: 'active',
    bills: [
      { id: 'b1', due: d(3, 10), amount: 1_000 },
      { id: 'b2', due: d(3, 22), amount: 500 },
    ],
    lastPayment: { date: d(2, 28), amount: 750 },
  },
  {
    id: 'v2',
    name: 'Müller Kaffee',
    termsDays: 14,
    status: 'on-hold',
    bills: [{ id: 'b3', due: d(4, 2), amount: 80 }],
  },
  { id: 'v3', name: 'Atlas Cloud', termsDays: 60, status: 'archived', bills: [] },
];

const base = { vendors, currency: 'EUR', locale: 'en-GB', today: TODAY };
const names = () =>
  screen
    .getAllByRole('row')
    .map((row) => row.querySelector('td')?.textContent ?? '')
    .filter(Boolean);

describe('VendorsList', () => {
  it('shows what is owed, overdue and due soon', () => {
    render(<VendorsList {...base} />);
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'P' && el.textContent === '3 vendors, €1,580.00 owed',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('1 vendor past due')).toBeInTheDocument();
  });

  it('searches with accents folded, and clears from the no results state', async () => {
    const user = userEvent.setup();
    render(<VendorsList {...base} />);
    const search = screen.getByRole('searchbox', { name: 'Search vendors' });
    await user.type(search, 'eclair');
    expect(names()).toHaveLength(2); // the vendor and the footer
    expect(names()[0]).toMatch(/Éclair Print Works/);
    await user.clear(search);
    await user.type(search, 'zzz');
    expect(screen.getByText('No vendors match "zzz"')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search and filter' }));
    expect(search).toHaveValue('');
    expect(screen.getByText('Atlas Cloud')).toBeInTheDocument();
  });

  it('filters by status from the keyboard', async () => {
    const user = userEvent.setup();
    render(<VendorsList {...base} />);
    const group = screen.getByRole('group', { name: 'Status' });
    within(group).getByRole('button', { name: /All/ }).focus();
    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    expect(within(group).getByRole('button', { name: /On hold/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByText('Atlas Cloud')).not.toBeInTheDocument();
    expect(screen.getByText('Müller Kaffee')).toBeInTheDocument();
  });

  it('sorts by a column header', async () => {
    const user = userEvent.setup();
    render(<VendorsList {...base} />);
    // Overdue first by default.
    expect(names()[0]).toMatch(/Éclair/);
    await user.click(screen.getByRole('button', { name: /^Vendor/ }));
    expect(names()[0]).toMatch(/Atlas Cloud/);
  });

  it('opens a vendor and adds one', async () => {
    const user = userEvent.setup();
    const onOpenVendor = vi.fn();
    const onAddVendor = vi.fn();
    render(<VendorsList {...base} onOpenVendor={onOpenVendor} onAddVendor={onAddVendor} />);
    await user.click(screen.getByRole('button', { name: 'Müller Kaffee' }));
    expect(onOpenVendor).toHaveBeenCalledWith(vendors[1]);
    await user.click(screen.getByRole('button', { name: 'Add vendor' }));
    expect(onAddVendor).toHaveBeenCalledOnce();
  });

  it('takes its words from messages', () => {
    render(
      <VendorsList {...base} messages={{ title: 'Suppliers', searchLabel: 'Search suppliers' }} />,
    );
    expect(screen.getByRole('heading', { name: 'Suppliers' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search suppliers' })).toBeInTheDocument();
  });

  it('shows an empty state with its action', () => {
    render(
      <MotionVendorsList
        {...base}
        vendors={[]}
        emptyAction={<button type="button">Import vendors</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No vendors yet');
    expect(screen.getByRole('button', { name: 'Import vendors' })).toBeInTheDocument();
  });
});
