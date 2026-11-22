import { PlusIcon } from '@phosphor-icons/react';
import * as plainPeople from '@rectio/blocks/people';
import type {
  IsoDay,
  LeaveDraft,
  LeaveRequest,
  PayrollStatus,
  TimesheetRow,
  TimesheetStatus,
} from '@rectio/blocks/people';
import * as movingPeople from '@rectio/blocks/people/motion';
import { Button, ThemeScope, cn } from '@rectio/ui';
import { useMemo, useState } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import {
  HOLIDAYS,
  LEAVE,
  LEAVE_TYPES,
  TIMESHEET,
  TODAY,
  WEEK,
  makeOrg,
  payroll,
} from './people-data';

type State =
  | 'timesheet'
  | 'timesheet-review'
  | 'timesheet-clock'
  | 'leave'
  | 'leave-form'
  | 'org'
  | 'payroll'
  | 'payroll-approved'
  | 'loading'
  | 'empty';

const STATES: readonly State[] = [
  'timesheet',
  'timesheet-review',
  'timesheet-clock',
  'leave',
  'leave-form',
  'org',
  'payroll',
  'payroll-approved',
  'loading',
  'empty',
];

function readState(): State {
  const state = new URLSearchParams(window.location.search).get('state');
  return STATES.find((s) => s === state) ?? 'timesheet';
}

const LOCALE = 'en-GB';
const PAY_DATE = new Date(2026, 10, 30);

function TimesheetView({ state, motion }: { state: State; motion: boolean }) {
  const people = motion ? movingPeople : plainPeople;
  const review = state === 'timesheet-review';
  const [rows, setRows] = useState<TimesheetRow[]>(TIMESHEET);
  const [week, setWeek] = useState<IsoDay>(WEEK);
  const [status, setStatus] = useState<TimesheetStatus>(review ? 'submitted' : 'draft');
  const [reason, setReason] = useState<string | undefined>(undefined);
  return (
    <people.Timesheet
      weekStart={week}
      rows={week === WEEK ? rows : []}
      status={status}
      locked={week < '2026-11-02'}
      today={TODAY}
      locale={LOCALE}
      holidays={HOLIDAYS}
      entry={state === 'timesheet-clock' ? 'clock' : 'decimal'}
      title={review ? 'Ines Carvalho, timesheet' : 'Timesheet'}
      review={
        status === 'submitted'
          ? { by: 'Ines Carvalho', on: '2026-11-27' }
          : status === 'rejected'
            ? { by: 'Dana Whitfield', ...(reason === undefined ? {} : { reason }) }
            : status === 'approved'
              ? { by: 'Dana Whitfield', on: TODAY }
              : undefined
      }
      onWeekChange={setWeek}
      onCellChange={(rowId, day, minutes) => {
        setRows((all) =>
          all.map((row) =>
            row.id === rowId ? { ...row, minutes: { ...row.minutes, [day]: minutes ?? 0 } } : row,
          ),
        );
      }}
      onNoteChange={(rowId, day, note) => {
        setRows((all) =>
          all.map((row) =>
            row.id === rowId ? { ...row, notes: { ...row.notes, [day]: note } } : row,
          ),
        );
      }}
      onAddRow={() => {
        setRows((all) => [
          ...all,
          { id: `row-${String(all.length)}`, project: 'Northwind retainer', minutes: {} },
        ]);
      }}
      {...(review
        ? {
            onApprove: () => {
              setStatus('approved');
            },
            onReject: (why: string) => {
              setReason(why);
              setStatus('rejected');
            },
          }
        : {
            onSubmit: () => {
              setStatus('submitted');
            },
            onRecall: () => {
              setStatus('draft');
            },
          })}
    />
  );
}

let nextLeave = 0;

function LeaveView({ state, motion }: { state: State; motion: boolean }) {
  const people = motion ? movingPeople : plainPeople;
  const [requests, setRequests] = useState<LeaveRequest[]>(LEAVE);
  const [asking, setAsking] = useState(state === 'leave-form');
  const decide = (target: LeaveRequest, status: LeaveRequest['status'], reason?: string) => {
    setRequests((all) =>
      all.map((r) =>
        r.id === target.id
          ? {
              ...r,
              status,
              decision: { by: 'Dana Whitfield', on: TODAY, ...(reason ? { reason } : {}) },
            }
          : r,
      ),
    );
  };
  const submit = (draft: LeaveDraft) => {
    nextLeave += 1;
    setRequests((all) => [
      {
        id: `new-${String(nextLeave)}`,
        person: { id: 'ines', name: 'Ines Carvalho' },
        type: draft.type,
        start: draft.start,
        end: draft.end,
        halfStart: draft.halfStart,
        halfEnd: draft.halfEnd,
        status: 'pending',
        ...(draft.note === '' ? {} : { note: draft.note }),
      },
      ...all,
    ]);
    setAsking(false);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <people.LeaveRequests
        title="Team leave"
        requests={requests}
        types={LEAVE_TYPES}
        today={TODAY}
        locale={LOCALE}
        holidays={HOLIDAYS}
        onApprove={(r) => {
          decide(r, 'approved');
        }}
        onDecline={(r, reason) => {
          decide(r, 'declined', reason);
        }}
      />
      {asking ? (
        <people.LeaveRequestForm
          types={LEAVE_TYPES}
          personId="ines"
          requests={requests}
          minDay={TODAY}
          defaultMonth="2026-12-01"
          numberOfMonths={1}
          holidays={HOLIDAYS}
          locale={LOCALE}
          onSubmit={submit}
          onCancel={() => {
            setAsking(false);
          }}
        />
      ) : (
        <people.LeaveRequests
          title="My leave"
          requests={requests.filter((r) => r.person.id === 'ines')}
          types={LEAVE_TYPES}
          balanceFor="ines"
          showPerson={false}
          defaultFilter="all"
          today={TODAY}
          locale={LOCALE}
          holidays={HOLIDAYS}
          onCancel={(r, reason) => {
            decide(r, 'cancelled', reason);
          }}
          actions={
            <Button
              size="sm"
              onClick={() => {
                setAsking(true);
              }}
            >
              <PlusIcon aria-hidden weight="bold" />
              Request leave
            </Button>
          }
        />
      )}
    </div>
  );
}

function OrgView({ motion }: { motion: boolean }) {
  const people = motion ? movingPeople : plainPeople;
  // 1,240 people: the chart draws only the open branches.
  const org = useMemo(() => makeOrg(1240), []);
  return (
    <people.OrgChart
      people={org}
      defaultSelected="p3"
      personHref={(person) => `#people/${person.id}`}
      description="Fernhill Systems, all offices"
    />
  );
}

function PayrollView({ state, motion }: { state: State; motion: boolean }) {
  const people = motion ? movingPeople : plainPeople;
  const approvedStart = state === 'payroll-approved';
  const [status, setStatus] = useState<PayrollStatus>(approvedStart ? 'approved' : 'review');
  const lines = useMemo(() => payroll(!approvedStart), [approvedStart]);
  return (
    <people.PayrollRun
      lines={lines}
      currency="GBP"
      locale={LOCALE}
      period="November 2026"
      payDate={PAY_DATE}
      status={status}
      lineHref={(line) => `#payroll/${line.id}`}
      fixHref={(line) => `#people/${line.id}/pay`}
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
  );
}

function Loading({ motion }: { motion: boolean }) {
  const people = motion ? movingPeople : plainPeople;
  return (
    <div className="grid gap-6">
      <people.Timesheet weekStart={WEEK} rows={[]} loading today={TODAY} locale={LOCALE} />
      <div className="grid gap-6 lg:grid-cols-2">
        <people.LeaveRequests requests={[]} types={LEAVE_TYPES} loading locale={LOCALE} />
        <people.OrgChart people={[]} loading />
      </div>
      <people.PayrollRun
        lines={[]}
        currency="GBP"
        period="November 2026"
        payDate={PAY_DATE}
        loading
        locale={LOCALE}
      />
    </div>
  );
}

function Empty({ motion }: { motion: boolean }) {
  const people = motion ? movingPeople : plainPeople;
  return (
    <div className="grid gap-6">
      <people.Timesheet
        weekStart={WEEK}
        rows={[]}
        today={TODAY}
        locale={LOCALE}
        onCellChange={() => undefined}
        onAddRow={() => undefined}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <people.LeaveRequests requests={[]} types={LEAVE_TYPES} locale={LOCALE} />
        <people.OrgChart people={[]} />
      </div>
      <people.PayrollRun
        lines={[]}
        currency="GBP"
        period="November 2026"
        payDate={PAY_DATE}
        locale={LOCALE}
      />
    </div>
  );
}

const HEADINGS: Record<State, [string, string]> = {
  timesheet: ['Time', 'Week 48, your hours so far'],
  'timesheet-review': ['Approvals', 'A submitted week waiting for you'],
  'timesheet-clock': ['Time', 'Hours and minutes, as a clock reads'],
  leave: ['Leave', 'Requests to decide and your own balance'],
  'leave-form': ['Leave', 'A new request beside the team’s'],
  org: ['People', 'Who reports to whom'],
  payroll: ['Payroll', 'November’s run, before approval'],
  'payroll-approved': ['Payroll', 'November’s run, approved and ready to pay'],
  loading: ['People', 'Every block while it loads'],
  empty: ['People', 'Every block before there is anything in it'],
};

/**
 * The people blocks: `?view=people&state=` timesheet (default), timesheet-review (an approver's
 * view of a submitted week), timesheet-clock (clock entry), leave, leave-form, org (1,240 people),
 * payroll (with exceptions), payroll-approved, loading and empty.
 */
export function PeoplePage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const canvas = usePageCanvas(theme, mode);
  const state = readState();
  const [title, lede] = HEADINGS[state];
  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        {/* A single block names itself: its page title stays for the outline but is not shown. */}
        {
          <header
            className={cn(
              'flex flex-col gap-1',
              state !== 'loading' && state !== 'empty' && 'sr-only',
            )}
          >
            <h1 className="font-display text-3xl font-heading tracking-tight text-fg">{title}</h1>
            <p className="text-sm text-fg-muted">{lede}</p>
          </header>
        }
        {state.startsWith('timesheet') ? (
          <TimesheetView state={state} motion={motion} />
        ) : state.startsWith('leave') ? (
          <LeaveView state={state} motion={motion} />
        ) : state === 'org' ? (
          <OrgView motion={motion} />
        ) : state.startsWith('payroll') ? (
          <PayrollView state={state} motion={motion} />
        ) : state === 'loading' ? (
          <Loading motion={motion} />
        ) : (
          <Empty motion={motion} />
        )}
      </main>
    </ThemeScope>
  );
}
