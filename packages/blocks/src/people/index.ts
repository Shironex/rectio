/**
 * rectio people blocks, plain variant: the HR side of a back office. A weekly timesheet, leave
 * requests with their balances and a request form, an org chart for organisations of any size,
 * and the review of a payroll run. The motioned twins have the same names and props in
 * `@rectio/blocks/people/motion`.
 *
 * Logic, day helpers and words come from their server-safe modules, so a server component can
 * import them; the components are client modules.
 */
export {
  addDays,
  daysBetween,
  daysFrom,
  isIsoDay,
  isWorkingDay,
  startOfWeek,
  toIsoDay,
  weekOf,
  weekday,
  WEEKEND,
  type IsoDay,
  type WorkCalendar,
} from './lib/days';
export { formatDate, formatDay, formatDayLong, formatDayRange, formatDays } from './lib/format';

export { Timesheet, type TimesheetProps, type TimesheetReview } from './timesheet/timesheet';
export { TIMESHEET_MESSAGES, type TimesheetMessages } from './timesheet/timesheet-messages';
export {
  MAX_DAY_MINUTES,
  cellMinutes,
  formatDuration,
  isEditable,
  parseDuration,
  timesheetTotals,
  type DayFlag,
  type DurationParse,
  type TimeEntry,
  type TimesheetDay,
  type TimesheetOptions,
  type TimesheetRow,
  type TimesheetStatus,
  type TimesheetTotals,
} from './timesheet/timesheet.logic';

export {
  LeaveBalances,
  LeaveRequests,
  LeaveStatusBadge,
  type LeaveRequestsProps,
} from './leave-requests/leave-requests';
export {
  LeaveRequestForm,
  type LeaveDraft,
  type LeaveRequestFormProps,
} from './leave-requests/leave-request-form';
export {
  LEAVE_REQUESTS_MESSAGES,
  type LeaveRequestsMessages,
} from './leave-requests/leave-requests-messages';
export {
  LEAVE_FILTERS,
  leaveBalances,
  leaveCounts,
  leaveHalves,
  leaveInView,
  leaveOverlaps,
  leaveProblem,
  overlapPeople,
  spanFromPicked,
  workingDaysOf,
  type LeaveBalance,
  type LeaveDecision,
  type LeaveFilter,
  type LeaveOverlap,
  type LeavePerson,
  type LeaveProblem,
  type LeaveRequest,
  type LeaveSpan,
  type LeaveStatus,
  type LeaveType,
} from './leave-requests/leave-requests.logic';

export { OrgChart, type OrgChartProps } from './org-chart/org-chart';
export { ORG_CHART_MESSAGES, type OrgChartMessages } from './org-chart/org-chart-messages';
export {
  buildOrg,
  managerChain,
  searchOrg,
  type OrgModel,
  type OrgPerson,
} from './org-chart/org-chart.logic';

export { PayrollRun, type PayrollRunProps } from './payroll-run/payroll-run';
export { PAYROLL_RUN_MESSAGES, type PayrollRunMessages } from './payroll-run/payroll-run-messages';
export {
  issueCounts,
  payrollPayouts,
  reviewPayroll,
  type PayrollIssue,
  type PayrollLine,
  type PayrollReview,
  type PayrollStatus,
  type PayrollTotals,
} from './payroll-run/payroll-run.logic';
