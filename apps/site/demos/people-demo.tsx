'use client';

import type * as PlainPeople from '@rectio/blocks/people';
import type {
  IsoDay,
  LeaveRequest,
  OrgPerson,
  PayrollLine,
  PayrollStatus,
  TimesheetRow,
  TimesheetStatus,
} from '@rectio/blocks/people';
import { Button } from '@rectio/ui';
import { useMemo, useState } from 'react';

/** The plain or the motion entry: both have the same names and props. */
type PeopleEntry = Pick<
  typeof PlainPeople,
  'LeaveRequestForm' | 'LeaveRequests' | 'OrgChart' | 'PayrollRun' | 'Timesheet'
>;

const TODAY = '2026-11-26';
const WEEK = '2026-11-23';
const LOCALE = 'en-GB';

const ROWS: TimesheetRow[] = [
  {
    id: 'harbor',
    project: 'Harbor Freight portal',
    task: 'Build',
    minutes: { '2026-11-23': 330, '2026-11-24': 270, '2026-11-26': 300 },
    notes: { '2026-11-24': 'Pairing on the carrier rate import.' },
  },
  {
    id: 'mesa',
    project: 'Mesa Clinics',
    task: 'Discovery workshop',
    minutes: { '2026-11-24': 240 },
  },
  {
    id: 'internal',
    project: 'Internal',
    task: 'Hiring panel',
    minutes: { '2026-11-23': 90, '2026-11-26': 60 },
  },
];

export function TimesheetDemo({ people }: { people: PeopleEntry }) {
  const [rows, setRows] = useState(ROWS);
  const [week, setWeek] = useState<IsoDay>(WEEK);
  const [status, setStatus] = useState<TimesheetStatus>('draft');
  return (
    <people.Timesheet
      className="w-full"
      weekStart={week}
      rows={week === WEEK ? rows : []}
      status={status}
      today={TODAY}
      locale={LOCALE}
      onWeekChange={setWeek}
      onCellChange={(rowId, day, minutes) => {
        setRows((all) =>
          all.map((r) =>
            r.id === rowId ? { ...r, minutes: { ...r.minutes, [day]: minutes ?? 0 } } : r,
          ),
        );
      }}
      onNoteChange={(rowId, day, note) => {
        setRows((all) =>
          all.map((r) => (r.id === rowId ? { ...r, notes: { ...r.notes, [day]: note } } : r)),
        );
      }}
      onSubmit={() => {
        setStatus('submitted');
      }}
      onRecall={() => {
        setStatus('draft');
      }}
    />
  );
}

const TYPES = [
  { id: 'annual', label: 'Annual leave', allowance: 25 },
  { id: 'sick', label: 'Sick leave' },
  { id: 'study', label: 'Study leave', allowance: 5 },
];

const LEAVE: LeaveRequest[] = [
  {
    id: 'l1',
    person: { id: 'ines', name: 'Ines Carvalho' },
    type: 'annual',
    start: '2026-12-21',
    end: '2026-12-25',
    status: 'pending',
    note: 'Family in Porto for the holidays.',
  },
  {
    id: 'l2',
    person: { id: 'tomasz', name: 'Tomasz Wrona' },
    type: 'annual',
    start: '2026-12-22',
    end: '2027-01-02',
    status: 'approved',
    decision: { by: 'Dana Whitfield', on: '2026-11-10' },
  },
  {
    id: 'l3',
    person: { id: 'amara', name: 'Amara Nwosu' },
    type: 'study',
    start: '2026-12-03',
    end: '2026-12-05',
    halfStart: true,
    status: 'pending',
  },
  {
    id: 'l4',
    person: { id: 'priya', name: 'Priya Raman' },
    type: 'annual',
    start: '2026-12-14',
    end: '2026-12-19',
    status: 'declined',
    decision: { by: 'Dana Whitfield', on: '2026-11-18', reason: 'Year-end release week.' },
  },
];

export function LeaveRequestsDemo({ people }: { people: PeopleEntry }) {
  const [requests, setRequests] = useState(LEAVE);
  const decide = (target: LeaveRequest, status: LeaveRequest['status'], reason?: string) => {
    setRequests((all) =>
      all.map((r) =>
        r.id === target.id
          ? { ...r, status, decision: { by: 'You', on: TODAY, ...(reason ? { reason } : {}) } }
          : r,
      ),
    );
  };
  return (
    <people.LeaveRequests
      className="w-full max-w-2xl"
      title="Team leave"
      requests={requests}
      types={TYPES}
      today={TODAY}
      locale={LOCALE}
      onApprove={(r) => {
        decide(r, 'approved');
      }}
      onDecline={(r, reason) => {
        decide(r, 'declined', reason);
      }}
    />
  );
}

export function LeaveRequestFormDemo({ people }: { people: PeopleEntry }) {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <people.LeaveRequestForm
        types={TYPES}
        personId="ines"
        requests={LEAVE}
        minDay={TODAY}
        defaultMonth="2026-12-01"
        numberOfMonths={1}
        holidays={{ '2026-12-25': 'Christmas Day' }}
        locale={LOCALE}
        onSubmit={(draft) => {
          setSent(
            `${draft.type}, ${draft.start} up to ${draft.end}, ${String(draft.halves / 2)} days`,
          );
        }}
      />
      <p className="text-sm text-fg-muted" aria-live="polite">
        {sent === null ? 'Nothing sent yet.' : `Sent: ${sent}`}
      </p>
    </div>
  );
}

const DEPARTMENTS = ['Engineering', 'Product', 'Finance', 'People', 'Sales', 'Operations'];
const FIRST = ['Ada', 'Bilal', 'Chiara', 'Dmitri', 'Elif', 'Farah', 'Goran', 'Hana', 'Ivo', 'Jia'];
const LAST = ['Abara', 'Becker', 'Costa', 'Dubois', 'Eriksen', 'Haddad', 'Ito', 'Jansen', 'Okafor'];

/** A made-up org of `size` people: a CEO, six heads and teams under them. */
function makeOrg(size: number): OrgPerson[] {
  const people: OrgPerson[] = [{ id: 'ceo', name: 'Dana Whitfield', title: 'Chief Executive' }];
  for (let index = 1; index < size; index += 1) {
    const head = index <= DEPARTMENTS.length;
    const department = DEPARTMENTS[(index - 1) % DEPARTMENTS.length] ?? 'Engineering';
    const mix = (Math.imul(index, 2654435761) >>> 0) >>> 8;
    people.push({
      id: `p${String(index)}`,
      name: `${FIRST[mix % FIRST.length] ?? ''} ${LAST[(mix >>> 4) % LAST.length] ?? ''}`,
      title: head
        ? `Head of ${department}`
        : department === 'Engineering'
          ? 'Engineer'
          : 'Specialist',
      department,
      managerId: head ? 'ceo' : `p${String(Math.floor((index - 1) / 8) || 1)}`,
    });
  }
  return people;
}

export function OrgChartDemo({ people }: { people: PeopleEntry }) {
  const org = useMemo(() => makeOrg(400), []);
  return <people.OrgChart className="w-full" people={org} defaultSelected="p2" />;
}

const line = (
  id: string,
  name: string,
  role: string,
  gross: number,
  rate: number,
  bankAccount: string | null,
): PayrollLine => {
  const deductions = Math.round(gross * rate);
  return {
    id,
    person: { name },
    role,
    gross,
    deductions,
    net: gross - deductions,
    employerCost: gross + Math.round(gross * 0.168),
    bankAccount,
  };
};

const LINES: PayrollLine[] = [
  line('a', 'Dana Whitfield', 'Chief Executive', 1_250_000, 0.38, '•• 4021'),
  line('b', 'Ines Carvalho', 'Senior Software Engineer', 641_667, 0.31, '•• 7720'),
  line('c', 'Amara Nwosu', 'People Partner', 412_500, 0.27, '•• 9035'),
  line('d', 'Priya Raman', 'Financial Analyst', 433_333, 0.28, null),
  line('e', 'Jonah Feld', 'Account Executive', 375_000, 0.26, '•• 6612'),
];

export function PayrollRunDemo({ people }: { people: PeopleEntry }) {
  const [fixed, setFixed] = useState(false);
  const [status, setStatus] = useState<PayrollStatus>('review');
  const lines = fixed
    ? LINES.map((l) => ({ ...l, bankAccount: l.bankAccount ?? '•• 3307' }))
    : LINES;
  return (
    <div className="flex w-full flex-col gap-3">
      <people.PayrollRun
        lines={lines}
        currency="GBP"
        locale={LOCALE}
        period="November 2026"
        payDate={new Date(2026, 10, 30)}
        status={status}
        onApprove={() => {
          setStatus('approved');
        }}
        onPay={() => {
          setStatus('paid');
        }}
        onReopen={() => {
          setStatus('review');
        }}
      />
      {!fixed && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => {
            setFixed(true);
          }}
        >
          Add the missing bank details
        </Button>
      )}
    </div>
  );
}
