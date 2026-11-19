import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Payouts, type Payout } from '../src/index';
import { Payouts as MotionPayouts } from '../src/motion';

/** The first match; jsdom has no container queries, so the narrow and wide copies both render. */
function first<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error('no match');
  return item;
}

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const TODAY = d(3, 19);

const payouts: Payout[] = [
  {
    id: 'p1',
    payee: 'Kestrel Analytics',
    amount: 1_200,
    method: 'bank-transfer',
    status: 'scheduled',
    date: d(3, 21),
  },
  {
    id: 'p2',
    payee: 'Vantaa Foods',
    amount: 4_120,
    method: 'instant',
    status: 'in-transit',
    date: d(3, 20),
  },
  { id: 'p3', payee: 'Atelier Lune', amount: 2_000, method: 'card', status: 'paid', date: d(3, 3) },
  {
    id: 'p4',
    payee: 'Borowik Meble',
    amount: 640.05,
    method: 'bank-transfer',
    destination: '•• 4821',
    status: 'failed',
    date: d(3, 17),
    failureReason: 'Account closed',
  },
];

const base = { payouts, currency: 'EUR', locale: 'en-GB', today: TODAY };

describe('Payouts', () => {
  it('leads with the next payout and the figures', () => {
    render(<Payouts {...base} />);
    expect(screen.getByText(/Next: .*to Vantaa Foods, arrives 20 Mar/)).toBeInTheDocument();
    expect(screen.getByText('1 payout to retry')).toBeInTheDocument();
    expect(screen.getByText('Bank said: Account closed')).toBeInTheDocument();
  });

  it('retries a failed payout', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Payouts {...base} onRetry={onRetry} />);
    const retry = first(screen.getAllByRole('button', { name: 'Retry €640.05 to Borowik Meble' }));
    await user.click(retry);
    expect(onRetry).toHaveBeenCalledWith(payouts[3]);
  });

  it('blocks Retry while it runs', () => {
    render(<Payouts {...base} onRetry={vi.fn()} retrying={['p4']} />);
    const retry = first(screen.getAllByRole('button', { name: 'Retry €640.05 to Borowik Meble' }));
    expect(retry).toHaveAttribute('aria-busy', 'true');
  });

  it('opens a payout from its payee', async () => {
    const user = userEvent.setup();
    const onOpenPayout = vi.fn();
    render(<Payouts {...base} onOpenPayout={onOpenPayout} />);
    await user.click(screen.getByRole('button', { name: 'Atelier Lune' }));
    expect(onOpenPayout).toHaveBeenCalledWith(payouts[2]);
  });

  it('filters by status from the keyboard and offers the way back', async () => {
    const user = userEvent.setup();
    render(<Payouts {...base} />);
    const group = screen.getByRole('group', { name: 'Status' });
    within(group).getByRole('button', { name: /All/ }).focus();
    await user.keyboard('{End}{Enter}');
    expect(within(group).getByRole('button', { name: /Cancelled/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('No cancelled payouts')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all payouts' }));
    expect(screen.getByText('Kestrel Analytics')).toBeInTheDocument();
  });

  it('takes its words from messages', () => {
    render(
      <Payouts
        {...base}
        messages={{ title: 'Wypłaty', failureLine: (reason) => `Bank: ${reason}` }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Wypłaty' })).toBeInTheDocument();
    expect(screen.getByText('Bank: Account closed')).toBeInTheDocument();
  });

  it('shows an empty state with its action', () => {
    render(
      <MotionPayouts
        {...base}
        payouts={[]}
        emptyAction={<button type="button">Schedule payout</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No payouts yet');
    expect(screen.getByRole('button', { name: 'Schedule payout' })).toBeInTheDocument();
  });
});
