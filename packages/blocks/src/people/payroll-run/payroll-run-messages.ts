import type { PayrollIssue, PayrollStatus } from './payroll-run.logic';

/** Every word the payroll run says, for apps that translate or reword them. Server safe. */
export interface PayrollRunMessages {
  title: string;
  /** Under the title: the period and the pay day. */
  period: (period: string, payDay: string) => string;
  steps: { review: string; approve: string; pay: string };
  /** Under each step: what it is waiting on. */
  stepNote: (status: PayrollStatus, step: 'review' | 'approve' | 'pay') => string | undefined;
  stepper: string;
  people: string;
  gross: string;
  deductions: string;
  net: string;
  employerCost: string;
  person: string;
  total: string;
  /** The table caption. */
  caption: (currency: string) => string;
  issue: Record<PayrollIssue, string>;
  /** The alert over the table while issues block approval. */
  issuesTitle: (count: number) => string;
  issuesNote: string;
  /** One kind of issue in the alert: `2 without bank details`. */
  issueCount: (issue: PayrollIssue, count: number) => string;
  /** Totals do not reconcile though every line looks fine (a rounding upstream). */
  unreconciled: string;
  filterLabel: string;
  filterAll: string;
  filterIssues: string;
  noBank: string;
  /** Under a name on a narrow screen. */
  lineDetail: (gross: string, deductions: string) => string;
  approve: string;
  /** Beside the disabled approve button. */
  approveBlocked: (count: number) => string;
  approveTitle: (period: string) => string;
  approveNote: (people: number, net: string, cost: string) => string;
  approveConfirm: string;
  pay: (net: string) => string;
  payTitle: string;
  payNote: (people: number, net: string, payDay: string) => string;
  payConfirm: string;
  reopen: string;
  cancel: string;
  paidTitle: (payDay: string) => string;
  paidNote: (people: number) => string;
  approvedNote: (payDay: string) => string;
  emptyTitle: string;
  emptyNote: string;
  emptyIssues: string;
  openLine: (name: string) => string;
}

const peopleWord = (count: number) => (count === 1 ? '1 person' : `${String(count)} people`);

export const PAYROLL_RUN_MESSAGES: PayrollRunMessages = {
  title: 'Payroll run',
  period: (period, payDay) => `${period}, paid on ${payDay}`,
  steps: { review: 'Review', approve: 'Approve', pay: 'Pay' },
  stepNote: (status, step) =>
    step === 'review'
      ? status === 'review'
        ? 'Check every line'
        : 'Checked'
      : step === 'approve'
        ? status === 'review'
          ? 'Waiting on review'
          : 'Approved'
        : status === 'paid'
          ? 'Sent to the bank'
          : status === 'approved'
            ? 'Ready to pay'
            : undefined,
  stepper: 'Payroll steps',
  people: 'People',
  gross: 'Gross',
  deductions: 'Deductions',
  net: 'Net pay',
  employerCost: 'Employer cost',
  person: 'Person',
  total: 'Total',
  caption: (currency) => `Payroll lines, amounts in ${currency}`,
  issue: {
    'missing-bank': 'No bank details',
    'negative-net': 'Negative net pay',
    mismatch: 'Does not add up',
    'invalid-amount': 'Amount not in minor units',
  },
  issuesTitle: (count) =>
    count === 1 ? '1 line blocks approval' : `${String(count)} lines block approval`,
  issuesNote: 'Fix these in the payroll system, then review again.',
  issueCount: (issue, count) =>
    `${String(count)} ${
      issue === 'missing-bank'
        ? 'without bank details'
        : issue === 'negative-net'
          ? 'with negative net pay'
          : issue === 'mismatch'
            ? 'where gross less deductions is not net'
            : 'with an amount that is not a whole number of minor units'
    }`,
  unreconciled: 'The totals do not reconcile: gross less deductions is not net pay.',
  filterLabel: 'Lines',
  filterAll: 'All',
  filterIssues: 'Issues',
  noBank: 'No bank details',
  lineDetail: (gross, deductions) => `Gross ${gross}, deductions ${deductions}`,
  approve: 'Approve run',
  approveBlocked: (count) =>
    count === 0
      ? 'Totals must reconcile first'
      : `Fix ${count === 1 ? '1 line' : `${String(count)} lines`} first`,
  approveTitle: (period) => `Approve payroll for ${period}?`,
  approveNote: (people, net, cost) =>
    `${peopleWord(people)}, ${net} net pay, ${cost} employer cost. Payment waits for the next step.`,
  approveConfirm: 'Approve',
  pay: (net) => `Pay ${net}`,
  payTitle: 'Send this payroll to the bank?',
  payNote: (people, net, payDay) =>
    `${net} to ${peopleWord(people)}, arriving on ${payDay}. This cannot be undone here.`,
  payConfirm: 'Pay',
  reopen: 'Back to review',
  cancel: 'Cancel',
  paidTitle: (payDay) => `Paid, arriving on ${payDay}`,
  paidNote: (people) => `${peopleWord(people)} paid. Payslips are ready to send.`,
  approvedNote: (payDay) => `Approved. Send it to the bank to pay on ${payDay}.`,
  emptyTitle: 'No one in this run',
  emptyNote: 'Lines appear once the payroll system has worked out the period.',
  emptyIssues: 'No issues. Every line can be paid.',
  openLine: (name) => `Open the payslip of ${name}`,
};
