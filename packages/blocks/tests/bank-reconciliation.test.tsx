import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  BankReconciliation,
  reconciliationReducer,
  type BookEntry,
  type ReconciliationMatch,
  type StatementLine,
} from '../src/index';
import { BankReconciliation as MotionBankReconciliation } from '../src/motion';

/** The first match; jsdom has no container queries, so the narrow and wide copies both render. */
function first<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error('no match');
  return item;
}

const d = (m: number, day: number) => new Date(2026, m - 1, day);

const statement: StatementLine[] = [
  {
    id: 's1',
    date: d(3, 2),
    description: 'Kestrel Analytics',
    reference: 'INV-0121',
    amount: 6_240,
  },
  { id: 's2', date: d(3, 5), description: 'Payroll', amount: -18_400 },
  { id: 's3', date: d(3, 6), description: 'Card fee', amount: -12.5 },
];
const book: BookEntry[] = [
  { id: 'b1', date: d(3, 1), description: 'Receipt Kestrel', reference: 'INV-0121', amount: 6_240 },
  { id: 'b2', date: d(3, 4), description: 'Payroll March', amount: -18_400 },
];

const base = {
  statement,
  book,
  statementBalance: 1_000,
  bookBalance: 1_012.5,
  currency: 'EUR',
  locale: 'en-GB',
};

/** The block with its pairs held the way an app would hold them. */
function Harness({ onReconcile }: { onReconcile?: () => void }) {
  const [matches, setMatches] = useState<readonly ReconciliationMatch[]>([]);
  return (
    <BankReconciliation
      {...base}
      matches={matches}
      onMatch={(bankId, bookId) => {
        setMatches((m) => reconciliationReducer(m, { type: 'match', bankId, bookId }));
      }}
      onUnmatch={(bankId) => {
        setMatches((m) => reconciliationReducer(m, { type: 'unmatch', bankId }));
      }}
      {...(onReconcile === undefined ? {} : { onReconcile })}
    />
  );
}

describe('BankReconciliation', () => {
  it('shows the balances and the difference with a true minus sign', () => {
    render(<Harness />);
    const figures = screen.getByText('Difference').closest('div');
    expect(figures).toHaveTextContent('−€12.50');
    expect(screen.getByText('0 of 3 lines matched')).toBeInTheDocument();
  });

  it('accepts a suggestion with Match and undoes it with Unmatch', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const match = first(
      screen.getAllByRole('button', { name: 'Match Kestrel Analytics to Receipt Kestrel' }),
    );
    await user.click(match);
    expect(screen.getByText('1 of 3 lines matched')).toBeInTheDocument();
    await user.click(first(screen.getAllByRole('button', { name: /^Matched/ })));
    const unmatch = first(screen.getAllByRole('button', { name: 'Unmatch Kestrel Analytics' }));
    await user.click(unmatch);
    expect(screen.getByText('0 of 3 lines matched')).toBeInTheDocument();
  });

  it('opens on the suggestions while there are any', () => {
    render(<Harness />);
    expect(first(screen.getAllByRole('button', { name: /^Suggested/ }))).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('offers Add to books on a line with nothing to match', async () => {
    const user = userEvent.setup();
    const onCreateEntry = vi.fn();
    render(
      <BankReconciliation
        {...base}
        matches={[]}
        defaultFilter="unmatched"
        onMatch={vi.fn()}
        onUnmatch={vi.fn()}
        onCreateEntry={onCreateEntry}
      />,
    );
    const add = screen.queryAllByRole('button', { name: /^Add .* to the books$/ });
    expect(add.length).toBeGreaterThan(0);
    await user.click(first(add));
    expect(onCreateEntry).toHaveBeenCalledTimes(1);
  });

  it('matches every suggestion at once with Match all', async () => {
    const user = userEvent.setup();
    const onMatch = vi.fn();
    render(<BankReconciliation {...base} matches={[]} onMatch={onMatch} onUnmatch={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /^Match all \d+$/ }));
    expect(onMatch.mock.calls.length).toBeGreaterThan(1);
  });

  it('calls back with the pair', async () => {
    const user = userEvent.setup();
    const onMatch = vi.fn();
    render(<BankReconciliation {...base} matches={[]} onMatch={onMatch} onUnmatch={vi.fn()} />);
    const match = first(screen.getAllByRole('button', { name: /^Match Payroll/ }));
    await user.click(match);
    expect(onMatch).toHaveBeenCalledWith('s2', 'b2');
  });

  it('filters by state from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Show' });
    const all = within(group).getByRole('button', { name: /All/ });
    all.focus();
    await user.keyboard('{ArrowLeft}{Enter}');
    expect(within(group).getByRole('button', { name: /Matched/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('No matched lines')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all lines' }));
    expect(screen.getByText('Card fee')).toBeInTheDocument();
  });

  it('keeps Mark reconciled disabled until everything agrees, and says why', () => {
    const onReconcile = vi.fn();
    render(<Harness onReconcile={onReconcile} />);
    const button = screen.getByRole('button', { name: 'Mark reconciled' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAccessibleDescription(/Still open: .+\. Difference −€12\.50/);
  });

  it('enables Mark reconciled when reconciled', async () => {
    const user = userEvent.setup();
    const onReconcile = vi.fn();
    render(
      <BankReconciliation
        {...base}
        statement={statement.slice(0, 2)}
        statementBalance={5}
        bookBalance={5}
        matches={[
          { bankId: 's1', bookId: 'b1' },
          { bankId: 's2', bookId: 'b2' },
        ]}
        onMatch={vi.fn()}
        onUnmatch={vi.fn()}
        onReconcile={onReconcile}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Mark reconciled' }));
    expect(onReconcile).toHaveBeenCalledOnce();
  });

  it('takes its words from messages', () => {
    render(
      <BankReconciliation
        {...base}
        matches={[]}
        onMatch={vi.fn()}
        onUnmatch={vi.fn()}
        messages={{ title: 'Uzgodnienie bankowe', statementBalance: 'Saldo wyciągu' }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Uzgodnienie bankowe' })).toBeInTheDocument();
    expect(screen.getByText('Saldo wyciągu')).toBeInTheDocument();
  });

  it('shows an empty state with its action', () => {
    render(
      <MotionBankReconciliation
        {...base}
        statement={[]}
        book={[]}
        matches={[]}
        onMatch={vi.fn()}
        onUnmatch={vi.fn()}
        emptyAction={<button type="button">Import statement</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Nothing to reconcile yet');
    expect(screen.getByRole('button', { name: 'Import statement' })).toBeInTheDocument();
  });
});
