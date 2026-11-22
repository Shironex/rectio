import { describe, expect, it } from 'vitest';

import {
  addDays,
  buildOrg,
  dayRoom,
  daysBetween,
  formatDayRange,
  formatDuration,
  isIsoDay,
  leaveBalances,
  leaveHalves,
  leaveOverlaps,
  leaveProblem,
  managerChain,
  ownLeaveOverlaps,
  parseDuration,
  payrollPayouts,
  reviewPayroll,
  searchOrg,
  spanFromPicked,
  startOfWeek,
  timesheetTotals,
  toIsoDay,
  weekOf,
  type LeaveRequest,
  type OrgPerson,
  type PayrollLine,
  type TimesheetRow,
} from '../src/people';

describe('people days', () => {
  it('steps across a clock change without losing or doubling a day', () => {
    // Europe moves its clocks on 29 March and 25 October 2026; day strings never see it.
    expect(weekOf('2026-03-23')).toEqual([
      '2026-03-23',
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
    ]);
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(daysBetween('2026-10-24', '2026-10-27')).toHaveLength(3);
  });

  it('finds the week start, checks day strings and reads the local day', () => {
    expect(startOfWeek('2026-11-26')).toBe('2026-11-23');
    expect(startOfWeek('2026-11-26', 0)).toBe('2026-11-22');
    expect(isIsoDay('2026-02-30')).toBe(false);
    expect(isIsoDay('2026-02-28')).toBe(true);
    expect(toIsoDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('writes a range with an exclusive end, without a dash', () => {
    expect(formatDayRange('2026-12-04', '2026-12-09', 'en-GB')).toBe('4 Dec to 8 Dec 2026');
    expect(formatDayRange('2026-12-04', '2026-12-05', 'en-GB')).toBe('4 Dec 2026');
    expect(formatDayRange('2026-12-30', '2027-01-03', 'en-GB')).toBe('30 Dec 2026 to 2 Jan 2027');
  });
});

describe('timesheet logic', () => {
  it('reads decimal hours, clock time and units into whole minutes', () => {
    expect(parseDuration('7.5')).toEqual({ ok: true, minutes: 450 });
    expect(parseDuration('7,25')).toEqual({ ok: true, minutes: 435 });
    expect(parseDuration('7:30')).toEqual({ ok: true, minutes: 450 });
    expect(parseDuration('7h 30m')).toEqual({ ok: true, minutes: 450 });
    expect(parseDuration('45m')).toEqual({ ok: true, minutes: 45 });
    expect(parseDuration('.5')).toEqual({ ok: true, minutes: 30 });
    expect(parseDuration('  ')).toEqual({ ok: true, minutes: null });
    expect(parseDuration('25')).toEqual({ ok: false, reason: 'too-long' });
    expect(parseDuration('7:75')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseDuration('-2')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseDuration('abc')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('formats minutes in the locale and the entry form', () => {
    expect(formatDuration(450, 'en-GB')).toBe('7.5');
    expect(formatDuration(450, 'pl-PL')).toBe('7,5');
    expect(formatDuration(20, 'en-GB')).toBe('0.33');
    expect(formatDuration(450, 'en-GB', 'clock')).toBe('7:30');
    expect(formatDuration(0, 'en-GB')).toBe('');
    expect(formatDuration(0, 'en-GB', 'decimal', { zero: true })).toBe('0');
  });

  it('adds minutes as integers, so 7.33 hours a day never drifts', () => {
    const minutes = Object.fromEntries(
      weekOf('2026-11-23')
        .slice(0, 5)
        .map((d) => [d, 440]),
    );
    const rows: TimesheetRow[] = [
      { id: 'a', project: 'A', minutes },
      { id: 'b', project: 'B', minutes: { '2026-11-23': 0.4 * 60, '2026-11-24': 20 } },
    ];
    const totals = timesheetTotals(rows, '2026-11-23', { today: '2026-11-30' });
    expect(totals.rows).toEqual({ a: 2200, b: 44 });
    expect(totals.week).toBe(2244);
    expect(formatDuration(totals.week, 'en-GB')).toBe('37.4');
  });

  it('flags over, short and missing days, never weekends, holidays or days to come', () => {
    const rows: TimesheetRow[] = [
      {
        id: 'a',
        project: 'A',
        minutes: {
          '2026-11-23': 600,
          '2026-11-24': 300,
          '2026-11-28': 120,
        },
      },
    ];
    const totals = timesheetTotals(rows, '2026-11-23', {
      today: '2026-11-27',
      holidays: { '2026-11-26': 'Thanksgiving' },
    });
    const flags = Object.fromEntries(totals.days.map((d) => [d.day, d.flag]));
    expect(flags).toEqual({
      '2026-11-23': 'over',
      '2026-11-24': 'short',
      '2026-11-25': 'missing',
      '2026-11-26': null,
      '2026-11-27': null,
      '2026-11-28': 'over',
      '2026-11-29': null,
    });
    expect(totals.days[3]?.off).toBe('Thanksgiving');
    expect(totals.days[6]?.off).toBe('weekend');
    expect(totals.expectedWeek).toBe(4 * 480);
    expect(totals.missing).toEqual(['2026-11-25']);
    expect(totals.overtime).toBe(0);
  });

  it('caps a cell at a day and ignores what is not a number', () => {
    const rows: TimesheetRow[] = [
      { id: 'a', project: 'A', minutes: { '2026-11-23': 5000, '2026-11-24': Number.NaN } },
    ];
    expect(timesheetTotals(rows, '2026-11-23', { today: '2026-11-23' }).week).toBe(1440);
  });
});

const person = (id: string) => ({ id, name: id.toUpperCase() });
const leave = (
  over: Partial<LeaveRequest> & Pick<LeaveRequest, 'id' | 'start' | 'end'>,
): LeaveRequest => ({
  person: person('ada'),
  type: 'annual',
  status: 'pending',
  ...over,
});

describe('leave logic', () => {
  it('counts working days in halves, skipping weekends and holidays', () => {
    // Friday 4 to Wednesday 9 December: Fri, Mon, Tue (Wed is the exclusive end).
    expect(leaveHalves({ start: '2026-12-04', end: '2026-12-09' })).toBe(6);
    expect(
      leaveHalves(
        { start: '2026-12-04', end: '2026-12-09' },
        { holidays: { '2026-12-07': 'Day' } },
      ),
    ).toBe(4);
    expect(
      leaveHalves({ start: '2026-12-04', end: '2026-12-09', halfStart: true, halfEnd: true }),
    ).toBe(4);
    expect(leaveHalves({ start: '2026-12-04', end: '2026-12-05', halfStart: true })).toBe(1);
    expect(leaveHalves({ start: '2026-12-05', end: '2026-12-07' })).toBe(0);
    // A half last day on a weekend takes nothing off.
    expect(leaveHalves({ start: '2026-12-04', end: '2026-12-06', halfEnd: true })).toBe(2);
  });

  it('turns a picked inclusive range into an exclusive end', () => {
    expect(spanFromPicked('2026-12-04', '2026-12-08')).toEqual({
      start: '2026-12-04',
      end: '2026-12-09',
    });
    expect(spanFromPicked('2026-12-08', '2026-12-04')).toEqual({
      start: '2026-12-04',
      end: '2026-12-09',
    });
  });

  it('holds pending leave against the balance and gives declined leave back', () => {
    const requests = [
      leave({ id: '1', start: '2026-12-07', end: '2026-12-09', status: 'approved' }),
      leave({
        id: '2',
        start: '2026-12-10',
        end: '2026-12-11',
        status: 'pending',
        halfStart: true,
      }),
      leave({ id: '3', start: '2026-12-14', end: '2026-12-19', status: 'declined' }),
      leave({
        id: '4',
        start: '2026-12-14',
        end: '2026-12-15',
        person: person('ben'),
        status: 'approved',
      }),
    ];
    const [annual, unpaid] = leaveBalances(
      [
        { id: 'annual', label: 'Annual', allowance: 25 },
        { id: 'unpaid', label: 'Unpaid' },
      ],
      requests,
      'ada',
    );
    expect(annual).toMatchObject({ allowance: 50, taken: 4, pending: 1, left: 45 });
    expect(unpaid).toMatchObject({ allowance: null, left: null });
    expect(leaveProblem({ start: '2026-12-01', end: '2026-12-31' }, annual)).toBeNull();
    expect(leaveProblem({ start: '2026-12-01', end: '2027-03-01' }, annual)).toBe('over-balance');
    expect(leaveProblem({ start: '2026-12-05', end: '2026-12-07' }, annual)).toBe(
      'no-working-days',
    );
    expect(leaveProblem(null, annual)).toBe('no-range');
  });

  it('finds teammates off on the same working days', () => {
    const team = [
      leave({
        id: 'b',
        person: person('ben'),
        start: '2026-12-08',
        end: '2026-12-12',
        status: 'approved',
      }),
      leave({
        id: 'c',
        person: person('cy'),
        start: '2026-12-01',
        end: '2026-12-04',
        status: 'approved',
      }),
      leave({
        id: 'd',
        person: person('di'),
        start: '2026-12-07',
        end: '2026-12-10',
        status: 'declined',
      }),
      leave({ id: 'e', person: person('ed'), start: '2026-12-12', end: '2026-12-14' }),
      leave({ id: 'self', start: '2026-12-07', end: '2026-12-11' }),
    ];
    const overlaps = leaveOverlaps({ start: '2026-12-07', end: '2026-12-14' }, team, {
      personId: 'ada',
    });
    // Ben overlaps on Tue to Fri; Ed only on a weekend; Di is declined; Cy ends before.
    expect(overlaps.map((o) => [o.request.id, o.days])).toEqual([
      ['b', ['2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11']],
    ]);
  });
});

function org(size: number): OrgPerson[] {
  // A CEO, 10 heads, and everyone else spread under the heads in teams of ten.
  const people: OrgPerson[] = [{ id: 'p0', name: 'Person 0', managerId: null }];
  for (let index = 1; index < size; index += 1) {
    const managerId = index <= 10 ? 'p0' : `p${String(Math.floor((index - 1) / 10))}`;
    people.push({ id: `p${String(index)}`, name: `Person ${String(index)}`, managerId });
  }
  return people;
}

describe('org chart logic', () => {
  it('builds the tree, team sizes and the chain of managers', () => {
    const model = buildOrg(org(1200));
    expect(model.roots.map((r) => r.id)).toEqual(['p0']);
    expect(model.teamSize.get('p0')).toBe(1199);
    expect(managerChain(model, 'p1199')).toEqual(['p0', 'p1', 'p11', 'p119']);
    expect(model.reports.get('p1')).toHaveLength(10);
  });

  it('builds 5,000 people quickly', () => {
    const people = org(5000);
    const started = performance.now();
    const model = buildOrg(people);
    searchOrg(model, 'person 49');
    // Linear work: a few milliseconds; the bound only catches an accidental quadratic walk.
    expect(performance.now() - started).toBeLessThan(500);
    expect(model.teamSize.get('p0')).toBe(4999);
  });

  it('keeps people whose manager is unknown or who sit in a loop of managers', () => {
    const model = buildOrg([
      { id: 'a', name: 'A', managerId: 'b' },
      { id: 'b', name: 'B', managerId: 'c' },
      { id: 'c', name: 'C', managerId: 'a' },
      { id: 'd', name: 'D', managerId: 'gone' },
      { id: 'e', name: 'E', managerId: 'e' },
    ]);
    expect(model.roots.map((r) => r.id).sort()).toEqual(['a', 'd', 'e']);
    expect(model.teamSize.get('a')).toBe(2);
    expect(managerChain(model, 'b')).toEqual(['a', 'c']);
  });

  it('searches names first, ignoring accents, then titles', () => {
    const model = buildOrg([
      { id: '1', name: 'Zoë Laurent', title: 'Engineer' },
      { id: '2', name: 'Amaya Zoller', title: 'Designer' },
      { id: '3', name: 'Kofi Mensah', title: 'Zoning lead' },
    ]);
    expect(searchOrg(model, 'zo').map((p) => p.id)).toEqual(['1', '2', '3']);
    expect(searchOrg(model, 'zoe').map((p) => p.id)).toEqual(['1']);
    expect(searchOrg(model, ' ')).toEqual([]);
  });
});

const line = (over: Partial<PayrollLine> & Pick<PayrollLine, 'id'>): PayrollLine => ({
  person: { name: over.id },
  gross: 500_000,
  deductions: 123_456,
  net: 376_544,
  employerCost: 600_000,
  bankAccount: '•• 1234',
  ...over,
});

describe('payroll logic', () => {
  it('sums minor units exactly and reconciles', () => {
    const lines = Array.from({ length: 1000 }, (_, index) =>
      line({ id: String(index), gross: 333_333, deductions: 111_111, net: 222_222 }),
    );
    const review = reviewPayroll(lines);
    expect(review.totals).toEqual({
      people: 1000,
      gross: 333_333_000,
      deductions: 111_111_000,
      net: 222_222_000,
      employerCost: 600_000_000,
    });
    expect(review.reconciled).toBe(true);
    expect(review.ready).toBe(true);
  });

  it('blocks approval on missing bank details, negative net, a mismatch or a fraction', () => {
    const review = reviewPayroll([
      line({ id: 'ok' }),
      line({ id: 'bank', bankAccount: null }),
      line({ id: 'neg', gross: 10_000, deductions: 12_000, net: -2_000 }),
      line({ id: 'off', net: 376_545 }),
      line({ id: 'frac', gross: 5000.5 }),
    ]);
    expect(Object.fromEntries(review.issues)).toEqual({
      bank: ['missing-bank'],
      neg: ['negative-net'],
      off: ['mismatch'],
      frac: ['invalid-amount'],
    });
    expect(review.ready).toBe(false);
    expect(review.reconciled).toBe(false);
    expect(reviewPayroll([]).ready).toBe(false);
  });

  it('hands net pay to the payouts logic in major units', () => {
    const payouts = payrollPayouts(
      [line({ id: 'a', net: 412_550 }), line({ id: 'b', net: 0 })],
      new Date(2026, 10, 28),
      'EUR',
      'Payroll Nov',
    );
    expect(payouts).toEqual([
      expect.objectContaining({
        payee: 'a',
        amount: 4125.5,
        method: 'bank-transfer',
        destination: '•• 1234',
        status: 'scheduled',
        reference: 'Payroll Nov',
      }),
    ]);
    expect(payrollPayouts([line({ id: 'j', net: 41_255 })], new Date(), 'JPY')[0]?.amount).toBe(
      41_255,
    );
  });
});

describe('people guards', () => {
  it('treats a day that does not exist as no day, never the next month', () => {
    expect(isIsoDay('2026-02-30')).toBe(false);
    expect(isIsoDay('2026-13-01')).toBe(false);
    expect(weekOf('2026-13-01')).toEqual([]);
    expect(daysBetween('2026-02-30', '2026-03-05')).toEqual([]);
  });

  it('refuses a grouped number and one under a minute', () => {
    expect(parseDuration('1,000')).toEqual({ ok: false, reason: 'ambiguous' });
    expect(parseDuration('1.000')).toEqual({ ok: false, reason: 'ambiguous' });
    expect(parseDuration('0.004')).toEqual({ ok: false, reason: 'too-small' });
    expect(parseDuration('0.008')).toEqual({ ok: false, reason: 'too-small' });
    // Fractions that are not a thousands group still read as hours.
    expect(parseDuration('7,5')).toEqual({ ok: true, minutes: 450 });
    expect(parseDuration('0.25')).toEqual({ ok: true, minutes: 15 });
    expect(parseDuration('0')).toEqual({ ok: true, minutes: 0 });
  });

  it('leaves a cell only what the other rows leave of the day', () => {
    const rows: TimesheetRow[] = [
      { id: 'a', project: 'A', minutes: { '2026-11-23': 900 } },
      { id: 'b', project: 'B', minutes: { '2026-11-23': 300 } },
    ];
    expect(dayRoom(rows, 'a', '2026-11-23')).toBe(1140);
    expect(dayRoom(rows, 'b', '2026-11-23')).toBe(540);
    expect(dayRoom(rows, 'c', '2026-11-23')).toBe(240);
    expect(dayRoom(rows, 'b', '2026-11-24')).toBe(1440);
  });

  it('finds the person’s own leave on the same days and refuses booking over it', () => {
    const own: LeaveRequest[] = [
      {
        id: '1',
        person: { id: 'p', name: 'P' },
        type: 'a',
        status: 'pending',
        start: '2026-12-07',
        end: '2026-12-10',
      },
      {
        id: '2',
        person: { id: 'p', name: 'P' },
        type: 'a',
        status: 'declined',
        start: '2026-12-14',
        end: '2026-12-16',
      },
      {
        id: '3',
        person: { id: 'q', name: 'Q' },
        type: 'a',
        status: 'approved',
        start: '2026-12-14',
        end: '2026-12-16',
      },
    ];
    const span = { start: '2026-12-09', end: '2026-12-15' };
    const overlaps = ownLeaveOverlaps(span, own, 'p');
    expect(overlaps.map((o) => [o.request.id, o.days])).toEqual([['1', ['2026-12-09']]]);
    expect(leaveProblem(span, undefined, {}, overlaps)).toBe('own-overlap');
    expect(ownLeaveOverlaps({ start: '2026-12-14', end: '2026-12-16' }, own, 'p')).toEqual([]);
  });

  it('refuses a span that ends on or before its start', () => {
    const span = { start: '2026-12-04', end: '2026-12-04' };
    expect(leaveHalves(span)).toBe(0);
    expect(leaveProblem(span, undefined)).toBe('no-range');
  });

  it('flags negative gross or deductions, repeated ids and totals past exact sums', () => {
    const line = (id: string, gross: number, deductions: number): PayrollLine => ({
      id,
      person: { name: id },
      gross,
      deductions,
      net: gross - deductions,
      employerCost: Math.max(gross, 0),
      bankAccount: '•• 1',
    });
    const negative = reviewPayroll([line('a', -100, -30), line('b', 100, -50)]);
    expect(negative.issues.get('a')).toContain('negative-amount');
    expect(negative.issues.get('b')).toEqual(['negative-amount']);
    expect(negative.ready).toBe(false);

    const repeated = reviewPayroll([line('a', 100, 0), line('a', 100, 0)]);
    expect(repeated.issues.get('a')).toEqual(['duplicate-id']);
    expect(repeated.flagged).toBe(1);
    expect(repeated.ready).toBe(false);

    const huge = reviewPayroll([line('a', Number.MAX_SAFE_INTEGER, 0), line('b', 10, 0)]);
    expect(huge.overflow).toBe(true);
    expect(huge.reconciled).toBe(false);
    expect(huge.ready).toBe(false);
  });
});
