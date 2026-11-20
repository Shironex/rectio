import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Ledger, type JournalLine, type LedgerAccount } from '../src/index';
import { Ledger as MotionLedger } from '../src/motion';

const d = (day: number) => new Date(2026, 2, day);

const accounts: LedgerAccount[] = [
  { code: '1000', name: 'Bank', normal: 'debit' },
  { code: '4000', name: 'Sales', normal: 'credit' },
];

const lines: JournalLine[] = [
  {
    id: 'l1',
    entryId: 'e1',
    date: d(2),
    reference: 'INV-1',
    description: 'Invoice paid',
    accountCode: '1000',
    debit: 500,
    credit: 0,
  },
  {
    id: 'l2',
    entryId: 'e1',
    date: d(2),
    reference: 'INV-1',
    description: 'Invoice paid',
    accountCode: '4000',
    debit: 0,
    credit: 500,
  },
];

const base = { accounts, lines, currency: 'EUR', locale: 'en-GB' };
const heading = () => screen.getByRole('heading', { level: 2 }).textContent;

describe('Ledger account', () => {
  it('opens on the account defaultAccount names', () => {
    render(<Ledger {...base} defaultAccount="4000" />);
    expect(heading()).toBe('4000 Sales');
  });

  it('follows a controlled account on every change, without a remount', () => {
    const { rerender } = render(<Ledger {...base} account="1000" />);
    expect(heading()).toBe('1000 Bank');
    rerender(<Ledger {...base} account="4000" />);
    expect(heading()).toBe('4000 Sales');
    rerender(<Ledger {...base} account="all" />);
    expect(heading()).toBe('General journal');
  });

  it('keeps the motion twin in step with a controlled account', () => {
    const onAccountChange = vi.fn();
    const { rerender } = render(
      <MotionLedger {...base} account="1000" onAccountChange={onAccountChange} />,
    );
    rerender(<MotionLedger {...base} account="4000" onAccountChange={onAccountChange} />);
    expect(heading()).toBe('4000 Sales');
    expect(onAccountChange).not.toHaveBeenCalled();
  });
});
