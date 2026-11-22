import type { DayFlag, TimesheetStatus } from './timesheet.logic';

/**
 * Every word the timesheet says, for apps that translate or reword them. Anything that names a
 * figure or a day is a function, so a language orders the words itself. Server safe.
 */
export interface TimesheetMessages {
  title: string;
  /** The week's dates under the title. */
  week: (range: string) => string;
  /** Joins the first and last day of a range: `23 Nov to 29 Nov 2026`. */
  range: (first: string, last: string) => string;
  previousWeek: string;
  nextWeek: string;
  /** Said when the week changes. */
  showingWeek: (range: string) => string;
  status: Record<TimesheetStatus, string>;
  locked: string;
  /** Under the status: hours against what the week expects. */
  summary: (logged: string, expected: string) => string;
  /** Hours with their unit, as a total reads: `38.5 h`, `7:30 h`. */
  hours: (value: string) => string;
  overtime: (hours: string) => string;
  missingDays: (count: number) => string;
  project: string;
  total: string;
  /** The row of day totals. */
  dayTotal: string;
  today: string;
  weekend: string;
  /** Names a cell's field: `Website redesign, Monday 23 November 2026`. */
  cell: (row: string, day: string) => string;
  /** Read after a cell that has a note. */
  hasNote: string;
  /** The words beside a day total for each flag. */
  flag: Record<DayFlag, string>;
  /** Read with a day total: `7.5 h, over by 1.5 h`. */
  flagDetail: (flag: DayFlag, difference: string) => string;
  /** The note field of the cell in focus. */
  noteFor: (row: string, day: string) => string;
  /** Before any cell has been picked. */
  noteHint: string;
  notePlaceholder: string;
  noNote: string;
  invalid: (text: string) => string;
  tooLong: string;
  /** How to type time, under an invalid cell: depends on the entry form. */
  entryHint: string;
  addRow: string;
  submit: string;
  submitTitle: string;
  submitMissing: (count: number, days: string) => string;
  submitNote: (hours: string) => string;
  submitConfirm: string;
  recall: string;
  approve: string;
  reject: string;
  rejectTitle: string;
  rejectNote: string;
  reasonLabel: string;
  reasonMissing: string;
  rejectConfirm: string;
  cancel: string;
  /** The approver's reason on a rejected week. */
  rejectedBy: (by: string) => string;
  approvedBy: (by: string, day: string) => string;
  submittedBy: (by: string, day: string) => string;
  /** Why the cells cannot be changed. */
  lockedNote: string;
  emptyTitle: string;
  emptyNote: string;
}

export const TIMESHEET_MESSAGES: TimesheetMessages = {
  title: 'Timesheet',
  week: (range) => `Week of ${range}`,
  range: (first, last) => `${first} to ${last}`,
  previousWeek: 'Previous week',
  nextWeek: 'Next week',
  showingWeek: (range) => `Showing ${range}`,
  status: {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Changes requested',
  },
  locked: 'Locked',
  summary: (logged, expected) => `${logged} of ${expected}`,
  hours: (value) => `${value} h`,
  overtime: (hours) => `${hours} overtime`,
  missingDays: (count) => (count === 1 ? '1 day missing' : `${String(count)} days missing`),
  project: 'Project',
  total: 'Total',
  dayTotal: 'Day total',
  today: 'Today',
  weekend: 'Weekend',
  cell: (row, day) => `${row}, ${day}`,
  hasNote: 'Has a note',
  flag: { over: 'Over', short: 'Short', missing: 'Missing' },
  flagDetail: (flag, difference) =>
    flag === 'over'
      ? `over by ${difference}`
      : flag === 'short'
        ? `short by ${difference}`
        : 'no time logged',
  noteFor: (row, day) => `Note for ${row}, ${day}`,
  noteHint: 'Pick a cell to read or add its note.',
  notePlaceholder: 'What was done, or why the day ran long',
  noNote: 'No note',
  invalid: (text) => `“${text}” is not a time.`,
  tooLong: 'A day has 24 hours at most.',
  entryHint: 'Type hours such as 7.5, 7:30 or 7h 30m.',
  addRow: 'Add project',
  submit: 'Submit week',
  submitTitle: 'Submit this week?',
  submitMissing: (count, days) =>
    `${count === 1 ? 'One working day has' : `${String(count)} working days have`} no time: ${days}. Submit anyway, or add the time first.`,
  submitNote: (hours) =>
    `${hours} goes to your approver. You cannot change it while it is reviewed.`,
  submitConfirm: 'Submit',
  recall: 'Recall',
  approve: 'Approve',
  reject: 'Request changes',
  rejectTitle: 'Request changes to this week?',
  rejectNote: 'The week opens again for edits, with your reason above it.',
  reasonLabel: 'What needs changing',
  reasonMissing: 'Say what needs changing.',
  rejectConfirm: 'Request changes',
  cancel: 'Cancel',
  rejectedBy: (by) => `${by} asked for changes`,
  approvedBy: (by, day) => `Approved by ${by} on ${day}`,
  submittedBy: (by, day) => `Submitted by ${by} on ${day}`,
  lockedNote: 'This week is closed. Ask your manager to reopen it.',
  emptyTitle: 'No projects this week',
  emptyNote: 'Add a project to start logging time.',
};
