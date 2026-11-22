import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkProvider } from '@rectio/ui';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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
  type TimesheetStatus,
} from '../src/people';
import {
  LeaveRequests as MotionLeaveRequests,
  OrgChart as MotionOrgChart,
  PayrollRun as MotionPayrollRun,
  Timesheet as MotionTimesheet,
} from '../src/people/motion';

/** The first of a query's matches, or a failure that names the missing element. */
function first<T>(found: readonly (T | null | undefined)[]): T {
  const element = found[0];
  if (element == null) throw new Error('element not found');
  return element;
}

const WEEK = '2026-11-23';
const ROWS: TimesheetRow[] = [
  {
    id: 'web',
    project: 'Website redesign',
    minutes: { '2026-11-23': 450, '2026-11-24': 480 },
    notes: { '2026-11-24': 'Client workshop' },
  },
  { id: 'ops', project: 'Internal', task: 'Hiring', minutes: { '2026-11-23': 30 } },
];

/** The wide layout: the grid. Both layouts render; CSS shows one. */
const grid = () =>
  within(document.querySelector<HTMLElement>('[data-slot="timesheet-grid"]') ?? document.body);

function EditableTimesheet({
  onChange = vi.fn(),
  status = 'draft',
  ...rest
}: {
  onChange?: (row: string, day: string, minutes: number | null) => void;
  status?: TimesheetStatus;
  onSubmit?: () => void;
  onNoteChange?: (row: string, day: string, note: string) => void;
}) {
  const [rows, setRows] = useState(ROWS);
  return (
    <Timesheet
      weekStart={WEEK}
      rows={rows}
      status={status}
      today="2026-11-26"
      locale="en-GB"
      onCellChange={(row, day, minutes) => {
        onChange(row, day, minutes);
        setRows((all) =>
          all.map((r) =>
            r.id === row ? { ...r, minutes: { ...r.minutes, [day]: minutes ?? 0 } } : r,
          ),
        );
      }}
      {...rest}
    />
  );
}

describe('Timesheet', () => {
  it('takes typed hours, keeps whole minutes and updates the totals', async () => {
    const onChange = vi.fn();
    render(<EditableTimesheet onChange={onChange} />);
    const cell = grid().getByRole('textbox', {
      name: 'Website redesign, Wednesday, 25 November 2026',
    });
    await userEvent.type(cell, '7:20');
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith('web', '2026-11-25', 440);
    // 450 + 480 + 440 + 30 minutes = 23 hours 20 minutes.
    expect(screen.getByText('23.33 h of 40 h')).toBeInTheDocument();
    expect(grid().getByRole('textbox', { name: /Website redesign, Wednesday,/ })).toHaveValue(
      '7.33',
    );
  });

  it('marks text that is not a time and lets Escape put the old value back', async () => {
    const onChange = vi.fn();
    render(<EditableTimesheet onChange={onChange} />);
    const cell = grid().getByRole('textbox', {
      name: 'Website redesign, Monday, 23 November 2026',
    });
    await userEvent.clear(cell);
    await userEvent.type(cell, 'lots{Enter}');
    expect(cell).toHaveAttribute('aria-invalid', 'true');
    expect(grid().getByRole('alert')).toHaveTextContent('“lots” is not a time.');
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.type(cell, '{Escape}');
    expect(cell).toHaveValue('7.5');
    expect(cell).not.toHaveAttribute('aria-invalid');
  });

  it('moves down the day with Enter and the arrow keys', async () => {
    render(<EditableTimesheet />);
    const first = grid().getByRole('textbox', {
      name: 'Website redesign, Tuesday, 24 November 2026',
    });
    await userEvent.click(first);
    await userEvent.keyboard('{Enter}');
    expect(
      grid().getByRole('textbox', { name: 'Internal, Hiring, Tuesday, 24 November 2026' }),
    ).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(first).toHaveFocus();
  });

  it('flags missing and over days in words and asks before submitting a short week', async () => {
    const onSubmit = vi.fn();
    render(<EditableTimesheet onSubmit={onSubmit} />);
    // Wednesday 25 is a past working day with nothing logged.
    expect(screen.getByText('1 day missing')).toBeInTheDocument();
    expect(grid().getByText('Missing')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit week' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('One working day has no time: Wed 25 Nov.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows and saves the note of the cell in focus', async () => {
    const onNoteChange = vi.fn();
    render(<EditableTimesheet onNoteChange={onNoteChange} />);
    const cell = grid().getByRole('textbox', {
      name: 'Website redesign, Tuesday, 24 November 2026',
    });
    expect(cell).toHaveAccessibleDescription('Has a note');
    await userEvent.click(cell);
    const note = grid().getByRole('textbox', { name: 'Note for Website redesign, Tue 24 Nov' });
    expect(note).toHaveValue('Client workshop');
    await userEvent.clear(note);
    await userEvent.type(note, 'Workshop and follow up');
    await userEvent.tab();
    expect(onNoteChange).toHaveBeenCalledWith('web', '2026-11-24', 'Workshop and follow up');
  });

  it('is read only once submitted, and the approver must give a reason to send it back', async () => {
    const onReject = vi.fn();
    const onApprove = vi.fn();
    render(
      <Timesheet
        weekStart={WEEK}
        rows={ROWS}
        status="submitted"
        today="2026-11-30"
        locale="en-GB"
        onCellChange={vi.fn()}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );
    expect(grid().getByRole('textbox', { name: /Website redesign, Monday/ })).toHaveAttribute(
      'readonly',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Request changes' }));
    expect(onReject).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Say what needs changing.')).toBeInTheDocument();
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'What needs changing' }),
      'Split Monday',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Request changes' }));
    expect(onReject).toHaveBeenCalledWith('Split Monday');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalled();
  });

  it('locks every cell of a locked week and moves between weeks with an announcement', async () => {
    const onWeekChange = vi.fn();
    render(
      <Timesheet
        weekStart={WEEK}
        rows={ROWS}
        locked
        today="2026-11-30"
        locale="en-GB"
        onCellChange={vi.fn()}
        onSubmit={vi.fn()}
        onWeekChange={onWeekChange}
      />,
    );
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit week' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(onWeekChange).toHaveBeenCalledWith('2026-11-30');
    expect(screen.getByText('Showing 30 Nov to 6 Dec 2026')).toBeInTheDocument();
  });

  it('takes hours and minutes in a TimeField in clock entry', () => {
    render(
      <Timesheet
        weekStart={WEEK}
        rows={ROWS}
        entry="clock"
        today="2026-11-30"
        locale="en-GB"
        onCellChange={vi.fn()}
      />,
    );
    expect(
      grid().getAllByRole('group', { name: 'Website redesign, Monday, 23 November 2026' })[0],
    ).toBeInTheDocument();
    expect(grid().getByText('16:00 h')).toBeInTheDocument();
  });

  it('renders its motion twin', () => {
    render(<MotionTimesheet weekStart={WEEK} rows={ROWS} today="2026-11-30" locale="en-GB" />);
    expect(screen.getByRole('heading', { name: 'Timesheet' })).toBeInTheDocument();
  });
});

const ada = { id: 'ada', name: 'Ada Okafor' };
const ben = { id: 'ben', name: 'Ben Ruiz' };
const TYPES = [
  { id: 'annual', label: 'Annual leave', allowance: 25 },
  { id: 'sick', label: 'Sick leave' },
];
const REQUESTS: LeaveRequest[] = [
  {
    id: '1',
    person: ada,
    type: 'annual',
    start: '2026-12-07',
    end: '2026-12-10',
    status: 'pending',
  },
  {
    id: '2',
    person: ben,
    type: 'annual',
    start: '2026-12-08',
    end: '2026-12-12',
    status: 'approved',
  },
  {
    id: '3',
    person: ada,
    type: 'annual',
    start: '2026-11-02',
    end: '2026-11-03',
    status: 'declined',
    decision: { by: 'Kai Lund', on: '2026-10-28', reason: 'Quarter close' },
  },
];

describe('LeaveRequests', () => {
  it('names overlaps and approves only after a confirm', async () => {
    const onApprove = vi.fn();
    render(
      <LeaveRequests
        requests={REQUESTS}
        types={TYPES}
        locale="en-GB"
        today="2026-11-30"
        onApprove={onApprove}
        onDecline={vi.fn()}
      />,
    );
    expect(screen.getByText('Overlaps with Ben Ruiz')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Approve: Ada Okafor, annual leave, 7 Dec to 9 Dec 2026',
      }),
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      '3 days come off their balance. Ben Ruiz is off on 2 of these days.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith(REQUESTS[0]);
  });

  it('asks for a reason to decline, and filters by status', async () => {
    const onDecline = vi.fn();
    render(
      <LeaveRequests requests={REQUESTS} types={TYPES} locale="en-GB" onDecline={onDecline} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Decline: Ada Okafor/ }));
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Reason' }), 'Release week');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Decline' }));
    expect(onDecline).toHaveBeenCalledWith(REQUESTS[0], 'Release week');
    await userEvent.click(screen.getByRole('button', { name: /^Declined/ }));
    expect(screen.getByText('Declined by Kai Lund, 28 Oct')).toBeInTheDocument();
    expect(screen.getByText('Reason: Quarter close')).toBeInTheDocument();
  });

  it('shows a balance by type and lets the requester cancel what has not started', () => {
    const onCancel = vi.fn();
    render(
      <LeaveRequests
        requests={REQUESTS}
        types={TYPES}
        locale="en-GB"
        today="2026-11-30"
        balanceFor="ada"
        showPerson={false}
        defaultFilter="all"
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('22 days left')).toBeInTheDocument();
    expect(screen.getByText('0 taken, 3 waiting, of 25')).toBeInTheDocument();
    // Ada's pending request and Ben's approved one that starts after today.
    expect(screen.getAllByRole('button', { name: /^Cancel request/ })).toHaveLength(2);
  });

  it('renders its motion twin', () => {
    render(<MotionLeaveRequests requests={[]} types={TYPES} />);
    expect(screen.getByText('No requests waiting')).toBeInTheDocument();
  });
});

describe('LeaveRequestForm', () => {
  it('counts working days with half days, warns of overlaps and sends an exclusive end', async () => {
    const onSubmit = vi.fn();
    render(
      <LeaveRequestForm
        types={TYPES}
        personId="ada"
        requests={REQUESTS}
        defaultMonth="2026-12-01"
        numberOfMonths={1}
        locale="en-GB"
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(first(screen.getAllByRole('button', { name: /11 December 2026/ })));
    await userEvent.click(first(screen.getAllByRole('button', { name: /15 December 2026/ })));
    // Fri 11, Mon 14, Tue 15: three working days; Ben is off on the Friday.
    expect(screen.getByText('3 days, 11 Dec to 15 Dec 2026')).toBeInTheDocument();
    expect(screen.getByText('Ben Ruiz is off on 1 of these days.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'End at midday on the last day' }));
    expect(screen.getByText('2.5 days, 11 Dec to 15 Dec 2026')).toBeInTheDocument();
    expect(screen.getByText('22 days left now, 19.5 days after this request')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'annual',
      start: '2026-12-11',
      end: '2026-12-16',
      halfStart: false,
      halfEnd: true,
      note: '',
      halves: 5,
    });
  });

  it('holds back a range of weekend days', async () => {
    const onSubmit = vi.fn();
    render(
      <LeaveRequestForm
        types={TYPES}
        personId="ada"
        defaultMonth="2026-12-01"
        numberOfMonths={1}
        locale="en-GB"
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(first(screen.getAllByRole('button', { name: /12 December 2026/ })));
    await userEvent.click(first(screen.getAllByRole('button', { name: /13 December 2026/ })));
    expect(screen.getByRole('alert')).toHaveTextContent('These days are all weekends or holidays.');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

function bigOrg(size: number): OrgPerson[] {
  const people: OrgPerson[] = [{ id: 'p0', name: 'Mara Vance', title: 'Chief Executive' }];
  for (let index = 1; index < size; index += 1) {
    people.push({
      id: `p${String(index)}`,
      name: `Person ${String(index)}`,
      title: index <= 10 ? 'Head' : 'Specialist',
      managerId: index <= 10 ? 'p0' : `p${String(Math.floor((index - 1) / 10))}`,
    });
  }
  return people;
}

const wide = () =>
  within(document.querySelector<HTMLElement>('[data-slot="org-chart-wide"]') ?? document.body);

describe('OrgChart', () => {
  beforeAll(() => {
    // jsdom has no layout, so no scrolling either.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('draws only the open branches of a large org and reveals anyone found by search', async () => {
    render(<OrgChart people={bigOrg(1500)} />);
    // The top and the ten heads: nothing below them is drawn yet.
    expect(wide().getAllByRole('treeitem')).toHaveLength(11);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Find a person' }), 'Person 1499');
    expect(screen.getByText('1 person found')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Person 1499/ }));
    const found = wide().getByRole('treeitem', { name: /Person 1499/ });
    expect(found).toHaveAttribute('aria-selected', 'true');
    expect(found).toHaveAttribute('aria-level', '5');
    expect(found).toHaveFocus();
    // Its chain opened, nothing else: 11 rows, then Person 1's 10, Person 14's 10 and Person 149's 9.
    expect(wide().getAllByRole('treeitem')).toHaveLength(40);
    expect(wide().getByRole('region', { name: 'Person 1499' })).toHaveTextContent('Reports to');
  });

  it('opens branches from the keyboard and shows the picked person with their manager', async () => {
    render(<OrgChart people={bigOrg(40)} defaultSelected="p0" />);
    const top = wide().getByRole('treeitem', { name: /Mara Vance/ });
    expect(top).toHaveAttribute('aria-expanded', 'true');
    expect(top).toHaveTextContent('39');
    await userEvent.click(wide().getByRole('treeitem', { name: /^Person 2, Head/ }));
    await userEvent.keyboard('{ArrowRight}');
    expect(wide().getByRole('treeitem', { name: /^Person 2, Head/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const panel = wide().getByRole('region', { name: 'Person 2' });
    await userEvent.click(within(panel).getByRole('button', { name: /Mara Vance/ }));
    expect(top).toHaveAttribute('aria-selected', 'true');
  });

  it('steps into a team and back up in the phone list, with links through the provider', async () => {
    render(
      <LinkProvider render={(props) => <a data-router {...props} />}>
        <OrgChart people={bigOrg(25)} personHref={(person) => `/people/${person.id}`} />
      </LinkProvider>,
    );
    const list = within(
      first([document.querySelector<HTMLElement>('[data-slot="org-chart-list"]')]),
    );
    await userEvent.click(list.getByRole('button', { name: "Open Mara Vance's team, 24 people" }));
    expect(list.getByRole('heading', { name: 'Mara Vance' })).toBeInTheDocument();
    expect(list.getByRole('link', { name: 'View profile' })).toHaveAttribute('data-router');
    await userEvent.click(list.getByRole('button', { name: 'Up to the top' }));
    expect(list.getByRole('heading', { name: 'Leadership' })).toBeInTheDocument();
  });

  it('renders its motion twin and an empty state', () => {
    render(<MotionOrgChart people={[]} />);
    expect(screen.getByText('No people yet')).toBeInTheDocument();
  });
});

const LINES: PayrollLine[] = [
  {
    id: 'a',
    person: { name: 'Ada Okafor' },
    role: 'Engineer',
    gross: 650_000,
    deductions: 198_250,
    net: 451_750,
    employerCost: 783_250,
    bankAccount: '•• 4821',
  },
  {
    id: 'b',
    person: { name: 'Ben Ruiz' },
    gross: 420_000,
    deductions: 120_000,
    net: 300_000,
    employerCost: 506_100,
    bankAccount: '',
  },
];

describe('PayrollRun', () => {
  const payDate = new Date(2026, 10, 28);

  it('totals minor units, flags lines and holds approval back', async () => {
    const onApprove = vi.fn();
    render(
      <PayrollRun
        lines={LINES}
        currency="EUR"
        locale="en-GB"
        period="November 2026"
        payDate={payDate}
        onApprove={onApprove}
      />,
    );
    const totals = first([document.querySelector('[data-slot="payroll-totals"]')]);
    expect(totals).toHaveTextContent('€7,517.50');
    expect(totals).toHaveTextContent('€12,893.50');
    expect(screen.getByText('1 line blocks approval')).toBeInTheDocument();
    expect(screen.getAllByText('No bank details').length).toBeGreaterThan(0);
    const approve = screen.getByRole('button', { name: 'Approve run' });
    expect(approve).toBeDisabled();
    expect(approve).toHaveAccessibleDescription('Fix 1 line first');
    await userEvent.click(first(screen.getAllByRole('button', { name: /^Issues/ })));
    expect(screen.queryByText('Ada Okafor')).toBeNull();
  });

  it('approves after a confirm once every line is clean, then pays', async () => {
    const onApprove = vi.fn();
    const clean = LINES.map((line) => ({ ...line, bankAccount: '•• 0001' }));
    const { rerender } = render(
      <PayrollRun
        lines={clean}
        currency="EUR"
        locale="en-GB"
        period="November 2026"
        payDate={payDate}
        onApprove={onApprove}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Approve run' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('2 people, €7,517.50 net pay, €12,893.50 employer cost.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalled();

    const onPay = vi.fn();
    rerender(
      <PayrollRun
        lines={clean}
        currency="EUR"
        locale="en-GB"
        period="November 2026"
        payDate={payDate}
        status="approved"
        onPay={onPay}
        onReopen={vi.fn()}
      />,
    );
    expect(screen.getByRole('list', { name: 'Payroll steps' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pay €7,517.50' }));
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Pay' }),
    );
    expect(onPay).toHaveBeenCalled();
  });

  it('renders its motion twin', () => {
    render(<MotionPayrollRun lines={[]} currency="EUR" period="November 2026" payDate={payDate} />);
    expect(screen.getByText('No one in this run')).toBeInTheDocument();
  });
});
