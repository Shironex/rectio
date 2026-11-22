import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  LeaveRequestForm,
  LeaveRequests,
  OrgChart,
  PayrollRun,
  Timesheet,
  type LeaveRequest,
  type OrgPerson,
  type PayrollLine,
  type TimesheetRow,
} from '../src/people';

// Each case here was a way to act on data that had changed, or to save what should be refused.

const grid = () =>
  within(document.querySelector<HTMLElement>('[data-slot="timesheet-grid"]') ?? document.body);

const ROWS: TimesheetRow[] = [
  { id: 'web', project: 'Website', minutes: { '2026-11-23': 450 } },
  { id: 'ops', project: 'Internal', minutes: { '2026-11-23': 30 } },
];

const sheet = {
  weekStart: '2026-11-23',
  rows: ROWS,
  today: '2026-11-30',
  locale: 'en-GB',
} as const;

describe('Timesheet guards', () => {
  it('drops a typed draft when the week locks before it is saved', async () => {
    const onCellChange = vi.fn();
    const { rerender } = render(<Timesheet {...sheet} onCellChange={onCellChange} />);
    const cell = grid().getByRole('textbox', { name: 'Website, Tuesday, 24 November 2026' });
    await userEvent.click(cell);
    await userEvent.keyboard('5');
    rerender(<Timesheet {...sheet} onCellChange={onCellChange} locked />);
    act(() => {
      cell.blur();
    });
    expect(onCellChange).not.toHaveBeenCalled();
    expect(cell).toHaveValue('');
    expect(cell).toHaveAttribute('readonly');
  });

  it('drops a typed draft when the week is submitted elsewhere', async () => {
    const onCellChange = vi.fn();
    const { rerender } = render(<Timesheet {...sheet} onCellChange={onCellChange} />);
    const cell = grid().getByRole('textbox', { name: 'Website, Tuesday, 24 November 2026' });
    await userEvent.click(cell);
    await userEvent.keyboard('5');
    rerender(<Timesheet {...sheet} onCellChange={onCellChange} status="submitted" />);
    act(() => {
      cell.blur();
    });
    expect(onCellChange).not.toHaveBeenCalled();
  });

  it('holds Submit back, in words, while a cell shows text that is not a time', async () => {
    const onSubmit = vi.fn();
    render(<Timesheet {...sheet} onCellChange={vi.fn()} onSubmit={onSubmit} />);
    const cell = grid().getByRole('textbox', { name: 'Website, Tuesday, 24 November 2026' });
    await userEvent.type(cell, 'lots{Enter}');
    const submit = screen.getByRole('button', { name: 'Submit week' });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(submit).toHaveAccessibleDescription('Fix the cell in red before submitting.');
    await userEvent.click(submit);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit from an open dialog once the week was submitted elsewhere', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <Timesheet {...sheet} onCellChange={vi.fn()} onSubmit={onSubmit} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit week' }));
    const dialog = await screen.findByRole('alertdialog');
    rerender(
      <Timesheet {...sheet} onCellChange={vi.fn()} onSubmit={onSubmit} status="submitted" />,
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses a cell that would take a day past 24 hours across its rows', async () => {
    const onCellChange = vi.fn();
    render(<Timesheet {...sheet} onCellChange={onCellChange} />);
    const cell = grid().getByRole('textbox', { name: 'Internal, Monday, 23 November 2026' });
    await userEvent.clear(cell);
    // Website already has 7.5 hours on Monday, so 16.5 are left.
    await userEvent.type(cell, '20{Enter}');
    expect(onCellChange).not.toHaveBeenCalled();
    expect(cell).toHaveAttribute('aria-invalid', 'true');
    expect(grid().getByRole('alert')).toHaveTextContent(
      "The day's rows would pass 24 hours: 16.5 h is left on this day.",
    );
    await userEvent.clear(cell);
    await userEvent.type(cell, '16.5{Enter}');
    expect(onCellChange).toHaveBeenCalledWith('ops', '2026-11-23', 990);
  });

  it('refuses a number with a grouping separator and one that rounds to nothing', async () => {
    const onCellChange = vi.fn();
    render(<Timesheet {...sheet} onCellChange={onCellChange} />);
    const cell = grid().getByRole('textbox', { name: 'Website, Tuesday, 24 November 2026' });
    await userEvent.type(cell, '1,000{Enter}');
    expect(grid().getByRole('alert')).toHaveTextContent('“1,000” could be read two ways.');
    await userEvent.clear(cell);
    await userEvent.type(cell, '0.004{Enter}');
    expect(grid().getByRole('alert')).toHaveTextContent('“0.004” is less than a minute.');
    expect(onCellChange).not.toHaveBeenCalled();
  });

  it('falls back to this week when the week start is not a real day', () => {
    render(<Timesheet {...sheet} weekStart="2026-13-01" today="2026-11-26" />);
    expect(
      grid().getByRole('columnheader', { name: 'Monday, 23 November 2026' }),
    ).toBeInTheDocument();
  });
});

const line = (id: string, bankAccount: string | null = '•• 0001'): PayrollLine => ({
  id,
  person: { name: `Person ${id}` },
  gross: 100_000,
  deductions: 20_000,
  net: 80_000,
  employerCost: 110_000,
  bankAccount,
});

const run = {
  currency: 'GBP',
  locale: 'en-GB',
  period: 'November 2026',
  payDate: new Date(2026, 10, 30),
} as const;

describe('PayrollRun guards', () => {
  it('checks the run again on confirm: a line flagged while the dialog was open stops approval', async () => {
    const onApprove = vi.fn();
    const { rerender } = render(<PayrollRun {...run} lines={[line('a')]} onApprove={onApprove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve run' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('1 person, £800.00 net pay');
    rerender(<PayrollRun {...run} lines={[line('a'), line('b', null)]} onApprove={onApprove} />);
    // The dialog follows the run as it is now.
    expect(dialog).toHaveTextContent('2 people, £1,600.00 net pay');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(onApprove).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    // Closed onto the lines in the way.
    expect(screen.queryByText('Person a')).toBeNull();
    expect(screen.getAllByText('Person b').length).toBeGreaterThan(0);
  });

  it('holds Pay back on an approved run with flagged lines and shows why', async () => {
    const onPay = vi.fn();
    render(
      <PayrollRun
        {...run}
        status="approved"
        onPay={onPay}
        lines={[line('a', null), { ...line('b'), gross: 0, deductions: 5, net: -5 }]}
      />,
    );
    expect(screen.getByText('2 lines block payment')).toBeInTheDocument();
    const pay = screen.getByRole('button', { name: /^Pay / });
    expect(pay).toHaveAttribute('aria-disabled', 'true');
    expect(pay).toHaveAccessibleDescription('Fix 2 lines before paying');
    await userEvent.click(pay);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onPay).not.toHaveBeenCalled();
  });

  it('keeps the dialog busy while a slow payment runs, so it cannot be sent twice', async () => {
    let settle: () => void = () => undefined;
    const onPay = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    render(<PayrollRun {...run} status="approved" onPay={onPay} lines={[line('a')]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay £800.00' }));
    const dialog = await screen.findByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', { name: 'Pay' });
    await userEvent.click(confirm);
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(confirm);
    expect(onPay).toHaveBeenCalledTimes(1);
    await act(async () => {
      settle();
      await Promise.resolve();
    });
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

const ada = { id: 'ada', name: 'Ada Okafor' };
const TYPES = [{ id: 'annual', label: 'Annual leave', allowance: 25 }];
const pending: LeaveRequest = {
  id: '1',
  person: ada,
  type: 'annual',
  start: '2026-12-07',
  end: '2026-12-10',
  status: 'pending',
};

describe('Leave guards', () => {
  it('closes without acting when the request was decided while the dialog was open', async () => {
    const onApprove = vi.fn();
    const { rerender } = render(
      <LeaveRequests requests={[pending]} types={TYPES} locale="en-GB" onApprove={onApprove} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Approve: Ada Okafor/ }));
    const dialog = await screen.findByRole('alertdialog');
    rerender(
      <LeaveRequests
        requests={[{ ...pending, status: 'declined' }]}
        types={TYPES}
        locale="en-GB"
        onApprove={onApprove}
      />,
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(onApprove).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('approves the request as it is now, not as it was when the dialog opened', async () => {
    const onApprove = vi.fn();
    const { rerender } = render(
      <LeaveRequests requests={[pending]} types={TYPES} locale="en-GB" onApprove={onApprove} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Approve: Ada Okafor/ }));
    const dialog = await screen.findByRole('alertdialog');
    const moved = { ...pending, end: '2026-12-09' };
    rerender(
      <LeaveRequests requests={[moved]} types={TYPES} locale="en-GB" onApprove={onApprove} />,
    );
    expect(dialog).toHaveTextContent('2 days come off their balance.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith(moved);
  });

  it('refuses booking over the person’s own pending leave', async () => {
    const onSubmit = vi.fn();
    render(
      <LeaveRequestForm
        types={TYPES}
        personId="ada"
        requests={[pending]}
        defaultMonth="2026-12-01"
        numberOfMonths={1}
        locale="en-GB"
        onSubmit={onSubmit}
      />,
    );
    const day = (name: RegExp) => screen.getAllByRole('button', { name })[0] ?? document.body;
    await userEvent.click(day(/8 December 2026/));
    await userEvent.click(day(/11 December 2026/));
    expect(screen.getByText('You are already off on these days')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You already have leave on some of these days.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('OrgChart guards', () => {
  it('says how many people a search found, not only how many it lists', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const people: OrgPerson[] = [{ id: 'p0', name: 'Mara Vance' }];
    for (let index = 1; index <= 20; index += 1) {
      people.push({ id: `p${String(index)}`, name: `Analyst ${String(index)}`, managerId: 'p0' });
    }
    render(<OrgChart people={people} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Find a person' }), 'Analyst');
    expect(screen.getAllByText('20 people found, first 8 shown').length).toBeGreaterThan(0);
  });
});
