import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  Billing,
  billingCardState,
  billingDaysLeft,
  billingInvoiceTotals,
  billingUsageLevel,
  billingUsageNote,
  type BillingInvoice,
  type BillingPlan,
} from '../../src/index';

const TODAY = new Date(2026, 2, 19);
const PLAN: BillingPlan = {
  id: 'growth',
  name: 'Growth',
  price: 192,
  interval: 'month',
  status: 'active',
  renewsOn: new Date(2026, 3, 1),
};
const INVOICES: BillingInvoice[] = [
  { id: 'a', number: 'FH-3', date: new Date(2026, 2, 1), amount: 192.1, status: 'open' },
  { id: 'b', number: 'FH-2', date: new Date(2026, 1, 1), amount: 192.2, status: 'paid' },
  { id: 'c', number: 'FH-1', date: new Date(2026, 0, 1), amount: 176.1, status: 'paid' },
  { id: 'd', number: 'FH-0', date: new Date(2025, 11, 1), amount: 50, status: 'void' },
];

describe('billing logic', () => {
  it('grades usage, warning from 80 per cent and over when full', () => {
    expect(billingUsageLevel(10, 100)).toBe('ok');
    expect(billingUsageLevel(80, 100)).toBe('warning');
    expect(billingUsageLevel(90, 100)).toBe('warning');
    expect(billingUsageLevel(100, 100)).toBe('warning');
    expect(billingUsageLevel(101, 100)).toBe('over');
    expect(billingUsageLevel(0, 0)).toBe('ok');
  });

  it('says the level in words', () => {
    const base = { id: 'r', label: 'Runs', unit: 'runs' };
    expect(billingUsageNote({ ...base, used: 9200, limit: 10000 }, 'en-GB', 'on 1 Apr')).toBe(
      '800 runs left, resets on 1 Apr',
    );
    expect(billingUsageNote({ ...base, used: 10, limit: 10 }, 'en-GB', null)).toBe(
      'All 10 runs in use',
    );
    expect(billingUsageNote({ ...base, used: 12, limit: 10 }, 'en-GB', null)).toBe(
      'Over the allowance by 2 runs',
    );
    expect(billingUsageNote({ ...base, used: 1, limit: 10 }, 'en-GB', null)).toBe(
      'Within the allowance',
    );
  });

  it('knows when a card expires and when the plan renews', () => {
    expect(billingCardState({ brand: 'Visa', last4: '1', expMonth: 4, expYear: 2026 }, TODAY)).toBe(
      'expiring',
    );
    expect(billingCardState({ brand: 'Visa', last4: '1', expMonth: 2, expYear: 2026 }, TODAY)).toBe(
      'expired',
    );
    expect(billingCardState({ brand: 'Visa', last4: '1', expMonth: 9, expYear: 2027 }, TODAY)).toBe(
      'ok',
    );
    expect(billingDaysLeft(PLAN, TODAY)).toBe(13);
  });

  it('totals paid and owed exactly, leaving void out', () => {
    expect(billingInvoiceTotals(INVOICES, 'EUR')).toEqual({
      paid: 368.3,
      owed: 192.1,
      owedCount: 1,
    });
  });
});

describe('Billing', () => {
  it('shows the plan, renewal and invoices, and downloads one', async () => {
    const onDownloadInvoice = vi.fn();
    render(
      <Billing
        plan={PLAN}
        invoices={INVOICES}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
        onDownloadInvoice={onDownloadInvoice}
      />,
    );
    expect(screen.getByText('Renews on 1 April 2026, in 13 days')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download FH-2' }));
    expect(onDownloadInvoice).toHaveBeenCalledWith(INVOICES[1]);
  });

  it('counts down a trial in place of empty usage', () => {
    render(
      <Billing
        plan={{ ...PLAN, status: 'trialing' }}
        paymentMethod={{ brand: 'Visa', last4: '4821', expMonth: 4, expYear: 2026 }}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
      />,
    );
    expect(screen.getByText('13 days left in your trial')).toBeInTheDocument();
    expect(screen.queryByText(/update it before the next charge/)).not.toBeInTheDocument();
  });

  it('shows the empty invoices note and a past due alert', () => {
    render(
      <Billing
        plan={{ ...PLAN, status: 'past-due' }}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
      />,
    );
    expect(screen.getByText('No invoices yet')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('The last payment did not go through.');
  });

  it('offers plan changes only when asked to', async () => {
    const onChangePlan = vi.fn();
    render(<Billing plan={PLAN} currency="EUR" today={TODAY} onChangePlan={onChangePlan} />);
    expect(screen.queryByRole('button', { name: 'Cancel plan' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Change plan' }));
    expect(onChangePlan).toHaveBeenCalled();
  });
});
