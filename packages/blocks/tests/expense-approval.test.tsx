import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ExpenseApproval,
  requestsInView,
  standingDecisions,
  viewCounts,
  type AuditEvent,
  type ExpenseRequest,
} from '../src/index';
import { ExpenseApproval as MotionExpenseApproval } from '../src/motion';

const d = (m: number, day: number) => new Date(2026, m - 1, day);

const requests: ExpenseRequest[] = [
  {
    id: 'r1',
    employee: 'Ciara Doyle',
    merchant: 'Aer Lingus',
    category: 'Travel',
    date: d(3, 10),
    amount: 412,
    status: 'pending',
  },
  {
    id: 'r2',
    employee: 'Ewan Burke',
    merchant: 'Hotel Bristol',
    category: 'Accommodation',
    date: d(3, 4),
    amount: 280,
    status: 'approved',
  },
  {
    id: 'r3',
    employee: 'Ciara Doyle',
    merchant: 'Bewleys',
    category: 'Meals',
    date: d(3, 6),
    amount: 38.5,
    status: 'rejected',
  },
];

const events: AuditEvent[] = [
  { id: 'e1', requestId: 'r2', action: 'approved', actor: 'Niamh Walsh', at: d(3, 5) },
  {
    id: 'e2',
    requestId: 'r3',
    action: 'rejected',
    actor: 'Niamh Walsh',
    at: d(3, 7),
    reason: 'Receipt missing, resubmit with it',
  },
];

const base = {
  requests,
  events,
  currency: 'EUR',
  locale: 'en-GB',
  onApprove: () => undefined,
  onReject: () => undefined,
};

const rows = () => screen.getAllByRole('row').slice(1);

/** The first match; jsdom has no container queries, so the narrow and wide copies both render. */
function first<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error('no match');
  return item;
}

describe('ExpenseApproval status views', () => {
  it('opens on the pending queue by default', () => {
    render(<ExpenseApproval {...base} />);
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Waiting/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lists approved expenses with who decided them, and reopens one', async () => {
    const user = userEvent.setup();
    const onReopen = vi.fn();
    render(<ExpenseApproval {...base} onReopen={onReopen} />);
    await user.click(screen.getByRole('button', { name: /Approved/ }));
    const [row] = rows();
    if (row === undefined) throw new Error('no row');
    expect(within(row).getByText('Hotel Bristol')).toBeInTheDocument();
    expect(within(row).getByText('Approved by Niamh Walsh, 5 Mar')).toBeInTheDocument();
    expect(within(row).queryByRole('checkbox')).toBeNull();
    await user.click(
      first(within(row).getAllByRole('button', { name: 'Reopen Hotel Bristol, Ewan Burke' })),
    );
    expect(onReopen).toHaveBeenCalledWith('r2');
  });

  it('shows the reason on a rejected expense', () => {
    render(<ExpenseApproval {...base} defaultStatus="rejected" />);
    expect(screen.getByText('Reason: Receipt missing, resubmit with it')).toBeInTheDocument();
    expect(screen.getByText(/1 rejected/)).toBeInTheDocument();
  });

  it('lists everything, the queue first, and still decides the pending one', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(<ExpenseApproval {...base} defaultStatus="all" onApprove={onApprove} />);
    expect(rows()).toHaveLength(3);
    expect(within(first(rows())).getByText('Aer Lingus')).toBeInTheDocument();
    await user.click(
      first(screen.getAllByRole('button', { name: 'Approve Aer Lingus, Ciara Doyle' })),
    );
    expect(onApprove).toHaveBeenCalledWith(['r1']);
  });

  it('follows a controlled status and reports the user pick', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const { rerender } = render(
      <ExpenseApproval {...base} status="approved" onStatusChange={onStatusChange} />,
    );
    expect(screen.getByText('Hotel Bristol')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Rejected/ }));
    expect(onStatusChange).toHaveBeenCalledWith('rejected');
    // Still controlled: nothing moves until the app passes the new status.
    expect(screen.getByText('Hotel Bristol')).toBeInTheDocument();
    rerender(<ExpenseApproval {...base} status="rejected" onStatusChange={onStatusChange} />);
    expect(screen.getByText('Bewleys')).toBeInTheDocument();
  });

  it('has an empty state per view', () => {
    render(
      <MotionExpenseApproval {...base} requests={[first(requests)]} defaultStatus="approved" />,
    );
    expect(screen.getByText('Nothing approved yet')).toBeInTheDocument();
  });

  it('can hide the filter', () => {
    render(<ExpenseApproval {...base} statusFilter={false} />);
    expect(screen.queryByRole('group', { name: 'Status' })).toBeNull();
  });
});

describe('approval view logic', () => {
  it('counts each view', () => {
    expect(viewCounts(requests)).toEqual({ pending: 1, approved: 1, rejected: 1, all: 3 });
  });

  it('orders the full list with the queue first, then newest', () => {
    expect(requestsInView(requests, 'all').map((r) => r.id)).toEqual(['r1', 'r3', 'r2']);
  });

  it('drops a decision once the request is reopened', () => {
    const reopened: AuditEvent[] = [
      ...events,
      { id: 'e3', requestId: 'r2', action: 'reopened', actor: 'Niamh Walsh', at: d(3, 8) },
    ];
    expect(standingDecisions(reopened).has('r2')).toBe(false);
    expect(standingDecisions(reopened).get('r3')?.reason).toBe('Receipt missing, resubmit with it');
  });
});
