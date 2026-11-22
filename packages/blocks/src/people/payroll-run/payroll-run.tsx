'use client';

import {
  ArrowCounterClockwiseIcon,
  BankIcon,
  CheckIcon,
  LockSimpleIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import {
  Alert,
  Anchor,
  Badge,
  SkeletonTable,
  Stepper,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  touchHitArea,
  type StepperStep,
} from '@rectio/ui';
import { useId, useState, type ReactNode } from 'react';

import { BlockPanel } from '../../lib/block-panel';
import { useBlockParts } from '../../lib/block-parts';
import { EmptyNote } from '../../lib/empty-note';
import { formatShortDate, fromMinor, resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { Segmented } from '../../lib/segmented';
import { MoreButton, useMore } from '../lib/more';
import { ConfirmDialog, type ConfirmRequest } from '../lib/confirm';
import { PersonAvatar } from '../lib/person';
import { PAYROLL_RUN_MESSAGES, type PayrollRunMessages } from './payroll-run-messages';
import {
  issueCounts,
  reviewPayroll,
  type PayrollIssue,
  type PayrollLine,
  type PayrollStatus,
} from './payroll-run.logic';

export interface PayrollRunProps {
  lines: readonly PayrollLine[];
  /** ISO 4217 code. Every amount in `lines` is in its minor units. */
  currency: string;
  /** The period paid, as you name it: `November 2026`. */
  period: string;
  /** The day the money arrives. */
  payDate: Date;
  status?: PayrollStatus | undefined;
  /** Approves a reviewed run, after a confirm; only offered with no issue left. */
  onApprove?: (() => unknown) | undefined;
  /** Sends an approved run to the bank, after a confirm. */
  onPay?: (() => unknown) | undefined;
  /** Takes an approved run back to review. */
  onReopen?: (() => void) | undefined;
  /** Links each name to the person's payslip, through the LinkProvider when there is one. */
  lineHref?: ((line: PayrollLine) => string) | undefined;
  /**
   * Where a flagged line is fixed (the person's record in your payroll system), through the
   * LinkProvider: adds a Fix link beside the line's issues.
   */
  fixHref?: ((line: PayrollLine, issues: readonly PayrollIssue[]) => string) | undefined;
  /** Lines drawn at first and per Show more; totals always cover every line. */
  pageSize?: number | undefined;
  locale?: string | undefined;
  title?: string | undefined;
  actions?: ReactNode;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | undefined;
  messages?: Partial<PayrollRunMessages> | undefined;
  className?: string | undefined;
}

type LineFilter = 'all' | 'issues';

const ISSUE_ORDER: readonly PayrollIssue[] = [
  'missing-bank',
  'negative-net',
  'mismatch',
  'invalid-amount',
];

/**
 * A payroll run before the money moves: the period, the people, gross, deductions, net pay and
 * employer cost per person and in total, in three steps (review, approve, pay). Lines with no bank
 * details, a negative net pay or figures that do not add up are flagged and hold the approval back
 * until they are fixed. The block adds and checks; the payroll maths stays in your system.
 */
export function PayrollRun({
  lines,
  currency,
  period,
  payDate,
  status = 'review',
  onApprove,
  onPay,
  onReopen,
  lineHref,
  fixHref,
  pageSize = 50,
  locale: requestedLocale,
  title,
  actions,
  loading = false,
  headingLevel,
  messages,
  className,
}: PayrollRunProps) {
  const m = mergeMessages(PAYROLL_RUN_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const { Button, Money, Rows, Row } = useBlockParts();
  const review = reviewPayroll(lines);
  const counts = issueCounts(review);
  const [filter, setFilter] = useState<LineFilter>('all');
  const [asking, setAsking] = useState<'approve' | 'pay' | null>(null);
  const blockedId = useId();
  const payDay = formatShortDate(payDate, locale);
  const money = (minor: number, className?: string) => (
    <Money
      amount={fromMinor(minor, currency)}
      currency={currency}
      locale={locale}
      className={className}
    />
  );
  const text = (minor: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .format(fromMinor(minor, currency))
      .replace('-', '−');
  const shown = filter === 'issues' ? lines.filter((line) => review.issues.has(line.id)) : lines;
  const { limit, more } = useMore(pageSize, filter);
  const { totals } = review;

  const steps: StepperStep[] = (['review', 'approve', 'pay'] as const).map((step) => ({
    title: m.steps[step],
    description: m.stepNote(status, step),
    ...(step === 'review' && status === 'review' && !review.ready
      ? { status: 'error' as const }
      : {}),
    ...(step === 'pay' && status === 'paid' ? { status: 'complete' as const } : {}),
  }));
  const current = status === 'review' ? 0 : 2;

  const approve = () => {
    setAsking('approve');
  };
  const pay = () => {
    setAsking('pay');
  };
  // The question is built from the run as it is now, never from when it opened: a line that turns
  // up flagged while the dialog is open changes its figures, and confirming checks again.
  const blocked = () => {
    if (review.flagged > 0) setFilter('issues');
  };
  const confirm: ConfirmRequest | null =
    asking === 'approve'
      ? {
          id: 'approve',
          title: m.approveTitle(period),
          description: m.approveNote(totals.people, text(totals.net), text(totals.employerCost)),
          confirm: m.approveConfirm,
          cancel: m.cancel,
          tone: 'neutral',
          onConfirm: () => {
            if (status !== 'review' || !review.ready) {
              blocked();
              return undefined;
            }
            return onApprove?.();
          },
        }
      : asking === 'pay'
        ? {
            id: 'pay',
            title: m.payTitle,
            description: m.payNote(totals.people, text(totals.net), payDay),
            confirm: m.payConfirm,
            cancel: m.cancel,
            tone: 'warning',
            onConfirm: () => {
              if (status !== 'approved' || !review.ready) {
                blocked();
                return undefined;
              }
              return onPay?.();
            },
          }
        : null;

  const figures: { term: string; value: ReactNode; lead?: boolean }[] = [
    { term: m.people, value: <span className="numeric">{totals.people}</span> },
    { term: m.gross, value: money(totals.gross) },
    { term: m.deductions, value: money(totals.deductions) },
    { term: m.net, value: money(totals.net), lead: true },
    { term: m.employerCost, value: money(totals.employerCost) },
  ];

  return (
    <BlockPanel
      title={title ?? m.title}
      description={m.period(period, payDay)}
      actions={actions}
      headingLevel={headingLevel ?? 2}
      className={className}
      bodyClassName="gap-5"
    >
      {!loading && lines.length > 0 && (
        <Stepper steps={steps} current={current} label={m.stepper} />
      )}
      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : lines.length === 0 ? (
        <EmptyNote title={m.emptyTitle} icon={UsersThreeIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <dl
            data-slot="payroll-totals"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line @xl:grid-cols-5"
          >
            {figures.map((figure) => (
              <div
                key={figure.term}
                className={cn(
                  'flex flex-col gap-1 bg-surface px-4 py-3',
                  figure.lead === true && 'bg-surface-raised',
                  figure.term === m.people && 'col-span-2 @xl:col-span-1',
                )}
              >
                <dt className="text-xs text-fg-muted">{figure.term}</dt>
                <dd
                  className={cn(
                    'font-display tracking-tight numeric',
                    figure.lead === true ? 'text-xl font-heading' : 'text-lg font-medium',
                  )}
                >
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>

          {review.flagged > 0 && (
            <Alert
              tone="danger"
              title={m.issuesTitle(review.flagged, status)}
              actions={
                filter === 'all' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setFilter('issues');
                    }}
                  >
                    {m.showIssues}
                  </Button>
                ) : undefined
              }
            >
              <ul className="list-none">
                {ISSUE_ORDER.filter((issue) => counts[issue] > 0).map((issue) => (
                  <li key={issue}>{m.issueCount(issue, counts[issue])}</li>
                ))}
              </ul>
              <p className="mt-1">{fixHref === undefined ? m.issuesNote : m.issuesNoteLinked}</p>
            </Alert>
          )}
          {review.flagged === 0 && !review.reconciled && (
            <Alert tone="danger" title={review.overflow ? m.overflow : m.unreconciled} />
          )}
          {status === 'approved' && review.ready && (
            <Alert tone="info" title={m.approvedNote(payDay)} />
          )}
          {status === 'paid' && (
            <Alert tone="success" title={m.paidTitle(payDay)}>
              {m.paidNote(totals.people)}
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {review.flagged > 0 && (
              <Segmented<LineFilter>
                label={m.filterLabel}
                value={filter}
                onValueChange={setFilter}
                options={[
                  { value: 'all', label: m.filterAll, hint: lines.length },
                  { value: 'issues', label: m.filterIssues, hint: review.flagged },
                ]}
              />
            )}
            {(status === 'review' && onApprove !== undefined) ||
            (status === 'approved' && (onPay !== undefined || onReopen !== undefined)) ? (
              <div className="ms-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2 pointer-coarse:gap-x-touch-gap">
                {(status === 'review' ? onApprove : onPay) !== undefined && !review.ready && (
                  <span id={blockedId} className="text-sm text-negative-strong">
                    {status === 'review'
                      ? m.approveBlocked(review.flagged)
                      : m.payBlocked(review.flagged)}
                  </span>
                )}
                {status === 'review' && onApprove !== undefined && (
                  <>
                    <Button
                      variant={review.ready ? 'primary' : 'secondary'}
                      aria-disabled={review.ready ? undefined : true}
                      aria-describedby={review.ready ? undefined : blockedId}
                      onClick={() => {
                        // Blocked, the button stays readable and in reach: a press lists the lines in the way.
                        if (review.ready) approve();
                        else blocked();
                      }}
                    >
                      {review.ready ? (
                        <CheckIcon aria-hidden weight="bold" className="size-4" />
                      ) : (
                        <LockSimpleIcon aria-hidden weight="bold" className="size-4" />
                      )}
                      {m.approve}
                    </Button>
                  </>
                )}
                {status === 'approved' && onReopen !== undefined && (
                  <Button variant="secondary" onClick={onReopen}>
                    <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-4" />
                    {m.reopen}
                  </Button>
                )}
                {status === 'approved' && onPay !== undefined && (
                  <Button
                    variant={review.ready ? 'primary' : 'secondary'}
                    aria-disabled={review.ready ? undefined : true}
                    aria-describedby={review.ready ? undefined : blockedId}
                    onClick={() => {
                      if (review.ready) pay();
                      else blocked();
                    }}
                  >
                    {review.ready ? (
                      <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
                    ) : (
                      <LockSimpleIcon aria-hidden weight="bold" className="size-4" />
                    )}
                    {m.pay(text(totals.net))}
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          <Table data-slot="payroll-lines">
            <TableCaption className="sr-only">{m.caption(currency)}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{m.person}</TableHead>
                <TableHead align="end" className="hidden @2xl:table-cell">
                  {m.gross}
                </TableHead>
                <TableHead align="end" className="hidden @2xl:table-cell">
                  {m.deductions}
                </TableHead>
                <TableHead align="end">{m.net}</TableHead>
                <TableHead align="end" className="hidden @3xl:table-cell">
                  {m.employerCost}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Rows>
                {shown.slice(0, limit).map((line, index, page) => {
                  const found = review.issues.get(line.id) ?? [];
                  // A repeated id (flagged as such) still gets its own row.
                  const repeat = page
                    .slice(0, index)
                    .filter((other) => other.id === line.id).length;
                  return (
                    <Row
                      key={repeat === 0 ? line.id : `${line.id}~${String(repeat)}`}
                      data-flagged={found.length > 0 || undefined}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <PersonAvatar
                            name={line.person.name}
                            src={line.person.avatar}
                            className="mt-0.5"
                          />
                          <div className="flex min-w-0 flex-col gap-0.5">
                            {lineHref === undefined ? (
                              <span className="font-medium">{line.person.name}</span>
                            ) : (
                              <Anchor
                                href={lineHref(line)}
                                className={cn('relative w-fit font-medium', touchHitArea)}
                                aria-label={m.openLine(line.person.name)}
                              >
                                {line.person.name}
                              </Anchor>
                            )}
                            <span className="text-sm text-fg-muted">
                              {line.role}
                              {line.role !== undefined &&
                                line.bankAccount != null &&
                                line.bankAccount !== '' &&
                                ', '}
                              {line.bankAccount != null && line.bankAccount !== '' && (
                                <span className="inline-flex items-center gap-1 numeric">
                                  <BankIcon aria-hidden weight="bold" className="size-3" />
                                  {line.bankAccount}
                                </span>
                              )}
                            </span>
                            <span className="text-sm text-fg-muted numeric @2xl:hidden">
                              {m.lineDetail(text(line.gross), text(line.deductions))}
                            </span>
                            {found.length > 0 && (
                              <span className="flex flex-wrap gap-1.5 pt-1">
                                {found.map((issue, index) => {
                                  const badge = (
                                    <Badge key={issue} tone="negative">
                                      <WarningIcon aria-hidden weight="bold" />
                                      {m.issue[issue]}
                                    </Badge>
                                  );
                                  const last = index === found.length - 1;
                                  if (!last || fixHref === undefined || status !== 'review') {
                                    return badge;
                                  }
                                  // The last badge and Fix wrap as one, so the link never sits alone.
                                  return (
                                    <span key={issue} className="inline-flex items-center gap-2">
                                      {badge}
                                      <Anchor
                                        href={fixHref(line, found)}
                                        className={cn(
                                          'relative text-sm font-medium whitespace-nowrap text-accent-strong underline underline-offset-2',
                                          touchHitArea,
                                        )}
                                        aria-label={m.fixLine(line.person.name)}
                                      >
                                        {m.fix}
                                      </Anchor>
                                    </span>
                                  );
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="end" className="hidden align-top @2xl:table-cell">
                        {money(line.gross)}
                      </TableCell>
                      <TableCell align="end" className="hidden align-top @2xl:table-cell">
                        {money(line.deductions)}
                      </TableCell>
                      <TableCell
                        align="end"
                        className={cn(
                          'align-top font-medium',
                          line.net < 0 && 'text-negative-strong',
                        )}
                      >
                        {money(line.net)}
                      </TableCell>
                      <TableCell align="end" className="hidden align-top @3xl:table-cell">
                        {money(line.employerCost)}
                      </TableCell>
                    </Row>
                  );
                })}
              </Rows>
            </TableBody>
            {filter === 'all' && (
              <TableFooter>
                <TableRow>
                  <TableHead scope="row">{m.total}</TableHead>
                  <TableCell align="end" className="hidden font-medium @2xl:table-cell">
                    {money(totals.gross)}
                  </TableCell>
                  <TableCell align="end" className="hidden font-medium @2xl:table-cell">
                    {money(totals.deductions)}
                  </TableCell>
                  <TableCell align="end" className="font-strong">
                    {money(totals.net)}
                  </TableCell>
                  <TableCell align="end" className="hidden font-medium @3xl:table-cell">
                    {money(totals.employerCost)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
          <MoreButton
            left={shown.length - limit}
            pageSize={pageSize}
            label={m.more}
            allShown={m.allShown(shown.length)}
            onMore={more}
          />
          {filter === 'issues' && shown.length === 0 && (
            <p className="text-sm text-fg-muted">{m.emptyIssues}</p>
          )}
        </>
      )}
      <ConfirmDialog
        request={confirm}
        onClose={() => {
          setAsking(null);
        }}
      />
    </BlockPanel>
  );
}
