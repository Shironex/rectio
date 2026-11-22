import type { LeaveFilter, LeaveProblem, LeaveStatus } from './leave-requests.logic';

/**
 * Every word the leave blocks say: the request form, the list of requests and the balances.
 * Anything that names a figure, a person or a day is a function. Server safe.
 */
export interface LeaveRequestsMessages {
  title: string;
  /** Under the title: how many wait for a decision. */
  summary: (pending: number) => string;
  /** Joins the first and last day of a range: `4 Dec to 8 Dec 2026`. */
  range: (first: string, last: string) => string;
  /** A count of days that can end in a half: `3.5 days`. */
  days: (count: string, halves: number) => string;
  filterLabel: string;
  /** Under a long list: `Show 50 more of 212`. */
  more: (count: number, left: number) => string;
  /** Where the focus lands once the last page is drawn: `All 212 shown`. */
  allShown: (count: number) => string;
  /** A filter in the narrow select, with its count: `Pending (3)`. */
  filterCount: (filter: string, count: number) => string;
  filters: Record<LeaveFilter, string>;
  status: Record<LeaveStatus, string>;
  /** Names a request in buttons and dialogs: `Ada Lovelace, annual leave, 4 Dec to 8 Dec 2026`. */
  requestName: (person: string, type: string, range: string) => string;
  /** On a half day: which half. */
  halfStart: string;
  halfEnd: string;
  /** Teammates off on the same days, on a row: `Overlaps with Ben Okafor and 1 more`. */
  overlapShort: (names: string, more: number) => string;
  /** The same in the form, with the days: `Ben Okafor is off on 2 of these days.` */
  overlapLong: (names: string, count: number, days: number) => string;
  overlapTitle: string;
  decided: (status: LeaveStatus, by: string, day: string) => string;
  reason: (reason: string) => string;
  approve: string;
  decline: string;
  cancelRequest: string;
  approveTitle: (name: string) => string;
  approveNote: (days: string, overlap: string | null) => string;
  approveConfirm: string;
  declineTitle: (name: string) => string;
  declineNote: string;
  declineConfirm: string;
  cancelTitle: string;
  cancelNote: (days: string) => string;
  cancelConfirm: string;
  keep: string;
  back: string;
  reasonLabel: string;
  reasonOptional: string;
  reasonMissing: string;
  emptyTitle: (filter: LeaveFilter) => string;
  emptyNote: string;
  /** Balances. */
  balances: string;
  left: string;
  unlimited: string;
  /** Under a balance: `3 taken, 1.5 waiting, of 25`. */
  balanceDetail: (taken: string, pending: string, allowance: string | null) => string;
  /** The form. */
  formTitle: string;
  typeLabel: string;
  /** In the type picker: `12.5 days left`. */
  typeLeft: (days: string) => string;
  datesLabel: string;
  halfStartLabel: string;
  halfEndLabel: string;
  halfDayLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  /** The preview line once a range is picked. */
  preview: (days: string, range: string) => string;
  /** The balance after this request: `14 days left, 10.5 after`. */
  balanceAfter: (now: string, after: string) => string;
  noBalanceLimit: string;
  problem: Record<LeaveProblem, string>;
  /** The alert naming the person's own leave a new request would book over. */
  ownOverlapTitle: string;
  ownOverlap: (requests: string) => string;
  submit: string;
  cancel: string;
}

const dayWord = (count: string, halves: number) => `${count} ${halves === 2 ? 'day' : 'days'}`;

export const LEAVE_REQUESTS_MESSAGES: LeaveRequestsMessages = {
  title: 'Leave requests',
  summary: (pending) =>
    pending === 0 ? 'Nothing waiting for a decision' : `${String(pending)} waiting for a decision`,
  range: (first, last) => `${first} to ${last}`,
  days: dayWord,
  filterLabel: 'Status',
  more: (count, left) => `Show ${String(count)} more of ${String(left)}`,
  allShown: (count) => `All ${String(count)} shown`,
  filterCount: (filter, count) => `${filter} (${String(count)})`,
  filters: {
    pending: 'Pending',
    approved: 'Approved',
    declined: 'Declined',
    cancelled: 'Cancelled',
    all: 'All',
  },
  status: {
    pending: 'Pending',
    approved: 'Approved',
    declined: 'Declined',
    cancelled: 'Cancelled',
  },
  requestName: (person, type, range) => `${person}, ${type.toLowerCase()}, ${range}`,
  halfStart: 'From midday',
  halfEnd: 'Until midday',
  overlapShort: (names, more) =>
    more === 0 ? `Overlaps with ${names}` : `Overlaps with ${names} and ${String(more)} more`,
  overlapLong: (names, count, days) =>
    `${names} ${count === 1 ? 'is' : 'are'} off on ${days === 1 ? '1 of these days' : `${String(days)} of these days`}.`,
  overlapTitle: 'Others are off then',
  decided: (status, by, day) =>
    `${status === 'approved' ? 'Approved' : status === 'declined' ? 'Declined' : 'Cancelled'} by ${by}, ${day}`,
  reason: (reason) => `Reason: ${reason}`,
  approve: 'Approve',
  decline: 'Decline',
  cancelRequest: 'Cancel request',
  approveTitle: (name) => `Approve leave for ${name}?`,
  approveNote: (days, overlap) =>
    overlap === null
      ? `${days} come off their balance.`
      : `${days} come off their balance. ${overlap}`,
  approveConfirm: 'Approve',
  declineTitle: (name) => `Decline leave for ${name}?`,
  declineNote: 'They see your reason with the decision.',
  declineConfirm: 'Decline',
  cancelTitle: 'Cancel this request?',
  cancelNote: (days) => `${days} go back to the balance.`,
  cancelConfirm: 'Cancel request',
  keep: 'Keep request',
  back: 'Back',
  reasonLabel: 'Reason',
  reasonOptional: 'Reason (optional)',
  reasonMissing: 'Say why, so they can plan around it.',
  emptyTitle: (filter) =>
    filter === 'pending'
      ? 'No requests waiting'
      : filter === 'all'
        ? 'No leave requests yet'
        : `No ${filter} requests`,
  emptyNote: 'Requests appear here as people send them.',
  balances: 'Balances',
  left: 'left',
  unlimited: 'No limit',
  balanceDetail: (taken, pending, allowance) =>
    `${taken} taken, ${pending} waiting${allowance === null ? '' : `, of ${allowance}`}`,
  formTitle: 'Request leave',
  typeLabel: 'Type',
  typeLeft: (days) => `${days} left`,
  datesLabel: 'Dates',
  halfStartLabel: 'Start at midday on the first day',
  halfEndLabel: 'End at midday on the last day',
  halfDayLabel: 'Half day only',
  noteLabel: 'Note for your approver',
  notePlaceholder: 'Optional, such as cover arranged with Ben',
  preview: (days, range) => `${days}, ${range}`,
  balanceAfter: (now, after) => `${now} left now, ${after} after this request`,
  noBalanceLimit: 'This type has no yearly limit.',
  problem: {
    'no-range': 'Pick the first and last day.',
    'no-working-days': 'These days are all weekends or holidays.',
    'own-overlap': 'You already have leave on some of these days.',
    'over-balance': 'This is more than the balance left.',
  },
  ownOverlapTitle: 'You are already off on these days',
  ownOverlap: (requests) =>
    `${requests}. Booking them again would take them from the balance twice: change the dates, or cancel the other request first.`,
  submit: 'Send request',
  cancel: 'Cancel',
};
