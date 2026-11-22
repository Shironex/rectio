import { addDays, daysBetween, isWorkingDay, type IsoDay, type WorkCalendar } from '../lib/days';

/**
 * Leave in working days. Every count is in half days, an integer, so a balance of 12.5 days minus
 * three half days is exact. A request runs from `start` up to, not including, `end`, the exclusive
 * end date the scheduling blocks use for all-day events: one day off on 4 December is start
 * 2026-12-04, end 2026-12-05. Server safe.
 */

export type LeaveStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface LeaveType {
  id: string;
  /** `Annual leave`, `Sick leave`. */
  label: string;
  /** Days a year this type allows; leave it out for a type with no limit, such as unpaid leave. */
  allowance?: number | undefined;
}

export interface LeavePerson {
  id: string;
  name: string;
  avatar?: string | undefined;
}

export interface LeaveDecision {
  by: string;
  on?: IsoDay | undefined;
  /** Why it was declined or cancelled. */
  reason?: string | undefined;
}

/** The days a request covers, with its half days. */
export interface LeaveSpan {
  start: IsoDay;
  /** Exclusive: the first day back. */
  end: IsoDay;
  /** The first day starts at midday: only its afternoon is off. */
  halfStart?: boolean | undefined;
  /** The last day ends at midday: only its morning is off. */
  halfEnd?: boolean | undefined;
}

export interface LeaveRequest extends LeaveSpan {
  id: string;
  person: LeavePerson;
  /** The id of its LeaveType. */
  type: string;
  status: LeaveStatus;
  note?: string | undefined;
  submittedOn?: IsoDay | undefined;
  decision?: LeaveDecision | undefined;
}

/** The working days of a span: weekends and holidays skipped. */
export function workingDaysOf(span: LeaveSpan, calendar: WorkCalendar = {}): IsoDay[] {
  return daysBetween(span.start, span.end).filter((day) => isWorkingDay(day, calendar));
}

/**
 * Half days a span takes from a balance: two for each working day, one less for a half first or
 * last day when that day is a working day. A one day span with either half is a half day.
 */
export function leaveHalves(span: LeaveSpan, calendar: WorkCalendar = {}): number {
  const days = workingDaysOf(span, calendar);
  if (days.length === 0) return 0;
  const first = span.start;
  const last = addDays(span.end, -1);
  if (first === last) return span.halfStart === true || span.halfEnd === true ? 1 : 2;
  let halves = days.length * 2;
  if (span.halfStart === true && days.includes(first)) halves -= 1;
  if (span.halfEnd === true && days.includes(last)) halves -= 1;
  return halves;
}

export interface LeaveBalance {
  type: LeaveType;
  /** Half days the year allows; null for a type with no limit. */
  allowance: number | null;
  /** Half days of approved leave. */
  taken: number;
  /** Half days waiting for a decision, held against the balance. */
  pending: number;
  /** Half days still free to book; null with no limit. */
  left: number | null;
}

/**
 * Each type's balance for one person: approved leave is taken, pending leave is held, declined and
 * cancelled leave gives the days back.
 */
export function leaveBalances(
  types: readonly LeaveType[],
  requests: readonly LeaveRequest[],
  personId: string,
  calendar: WorkCalendar = {},
): LeaveBalance[] {
  return types.map((type) => {
    let taken = 0;
    let pending = 0;
    for (const request of requests) {
      if (request.person.id !== personId || request.type !== type.id) continue;
      if (request.status === 'approved') taken += leaveHalves(request, calendar);
      else if (request.status === 'pending') pending += leaveHalves(request, calendar);
    }
    const allowance = type.allowance === undefined ? null : Math.round(type.allowance * 2);
    return {
      type,
      allowance,
      taken,
      pending,
      left: allowance === null ? null : allowance - taken - pending,
    };
  });
}

export interface LeaveOverlap {
  request: LeaveRequest;
  /** The working days both are off. */
  days: IsoDay[];
}

/**
 * Teammates off on the same working days as `span`: approved or pending leave of anyone but
 * `personId` (pass the request's own id as `exceptId` to leave it out), soonest first.
 */
export function leaveOverlaps(
  span: LeaveSpan,
  team: readonly LeaveRequest[],
  {
    personId,
    exceptId,
    calendar = {},
  }: { personId?: string; exceptId?: string; calendar?: WorkCalendar } = {},
): LeaveOverlap[] {
  const mine = new Set(workingDaysOf(span, calendar));
  if (mine.size === 0) return [];
  const overlaps: LeaveOverlap[] = [];
  for (const request of team) {
    if (request.id === exceptId || request.person.id === personId) continue;
    if (request.status !== 'approved' && request.status !== 'pending') continue;
    if (request.end <= span.start || request.start >= span.end) continue;
    const days = workingDaysOf(request, calendar).filter((day) => mine.has(day));
    if (days.length > 0) overlaps.push({ request, days });
  }
  return overlaps.toSorted((a, b) => (a.days[0] ?? '').localeCompare(b.days[0] ?? ''));
}

/** Distinct people in a set of overlaps, in order of first appearance. */
export function overlapPeople(overlaps: readonly LeaveOverlap[]): LeavePerson[] {
  const seen = new Map<string, LeavePerson>();
  for (const { request } of overlaps) {
    if (!seen.has(request.person.id)) seen.set(request.person.id, request.person);
  }
  return [...seen.values()];
}

export type LeaveProblem = 'no-range' | 'no-working-days' | 'over-balance';

/** What stops a request from being sent, or null when it can go. */
export function leaveProblem(
  span: LeaveSpan | null,
  balance: LeaveBalance | undefined,
  calendar: WorkCalendar = {},
): LeaveProblem | null {
  if (span === null || span.end <= span.start) return 'no-range';
  const halves = leaveHalves(span, calendar);
  if (halves === 0) return 'no-working-days';
  if (balance?.left != null && halves > balance.left) return 'over-balance';
  return null;
}

export type LeaveFilter = 'all' | LeaveStatus;

export const LEAVE_FILTERS: readonly LeaveFilter[] = [
  'pending',
  'approved',
  'declined',
  'cancelled',
  'all',
];

const ORDER: Record<LeaveStatus, number> = { pending: 0, approved: 1, declined: 2, cancelled: 3 };

/** The requests in a filter: pending first (they need someone), then by start date, soonest first. */
export function leaveInView(
  requests: readonly LeaveRequest[],
  filter: LeaveFilter,
): LeaveRequest[] {
  return requests
    .filter((request) => filter === 'all' || request.status === filter)
    .toSorted((a, b) => ORDER[a.status] - ORDER[b.status] || a.start.localeCompare(b.start));
}

export function leaveCounts(requests: readonly LeaveRequest[]): Record<LeaveFilter, number> {
  const counts: Record<LeaveFilter, number> = {
    all: requests.length,
    pending: 0,
    approved: 0,
    declined: 0,
    cancelled: 0,
  };
  for (const request of requests) counts[request.status] += 1;
  return counts;
}

/**
 * The inclusive range a calendar picks, turned into a span with an exclusive end: the last day
 * picked plus one.
 */
export function spanFromPicked(from: IsoDay, to: IsoDay): LeaveSpan {
  return from <= to ? { start: from, end: addDays(to, 1) } : { start: to, end: addDays(from, 1) };
}
