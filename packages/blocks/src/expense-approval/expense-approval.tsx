import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  FlagIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  Badge,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useState, type KeyboardEvent, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Segmented } from '../lib/segmented';
import { formatShortDate, resolveLocale, sumMoney } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { StateBadge } from '../lib/state-badge';
import {
  APPROVAL_VIEWS,
  MIN_REASON_LENGTH,
  reasonProblem,
  requestsInView,
  standingDecisions,
  viewCounts,
  type ApprovalView,
  type AuditAction,
  type AuditEvent,
  type ExpenseRequest,
} from './expense-approval.logic';

export interface ExpenseApprovalProps {
  requests: readonly ExpenseRequest[];
  /** The audit trail, oldest first. The newest decisions are shown. */
  events: readonly AuditEvent[];
  currency: string;
  locale?: string;
  onApprove: (ids: string[]) => void;
  onReject: (ids: string[], reason: string) => void;
  /** Offers Undo on decided requests in the trail, and Reopen on decided rows. */
  onReopen?: (id: string) => void;
  /**
   * Which requests are listed, controlled: the pending queue, the approved or rejected ones, or
   * all. Pair it with `onStatusChange`.
   */
  status?: ApprovalView;
  /** The view the block opens on when `status` is not set. Default `pending`, the queue. */
  defaultStatus?: ApprovalView;
  /** Called with the view the user picks in the filter. */
  onStatusChange?: (status: ApprovalView) => void;
  /** Shows the status filter above the list. Default true. */
  statusFilter?: boolean;
  /** How many decisions the trail shows. */
  trailLength?: number;
  title?: string;
  /** Shown in the empty state under its note, such as a link to the submitted expenses. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `EXPENSE_APPROVAL_MESSAGES`. */
  messages?: Partial<ExpenseApprovalMessages>;
  className?: string;
}

export interface ExpenseApprovalMessages extends CommonMessages {
  title: string;
  /** Names the status filter. */
  statusLabel: string;
  /** The filter's word for each view. */
  views: Record<ApprovalView, string>;
  /** Under the title outside the queue: "4 approved, €1,230 in total". */
  viewSummary: (
    view: Exclude<ApprovalView, 'pending'>,
    count: number,
    total: ReactNode,
  ) => ReactNode;
  /** The empty state of a view other than the queue: "Nothing approved yet". */
  viewEmptyTitle: (view: Exclude<ApprovalView, 'pending'>) => string;
  viewEmptyNote: string;
  /** The table caption outside the queue; `view` is the view's word. */
  viewCaption: (view: string, currency: string) => string;
  /** Under a decided expense: "Approved by Aoife Byrne, 3 Mar". */
  decisionLine: (action: 'approved' | 'rejected', actor: string, date: string) => string;
  reopen: string;
  reopenOne: (merchant: string, employee: string) => string;
  /** Under the title: "6 waiting, €2,140 in total". */
  summary: (count: number, total: ReactNode) => ReactNode;
  nothingWaiting: string;
  selectAll: string;
  selectHint: string;
  selected: (count: number, total: ReactNode) => ReactNode;
  rejectMany: (count: number) => string;
  approveMany: (count: number) => string;
  emptyTitle: string;
  emptyNote: string;
  tableCaption: (currency: string) => string;
  select: string;
  expense: string;
  category: string;
  amount: string;
  decision: string;
  selectOne: (merchant: string, employee: string) => string;
  approve: string;
  reject: string;
  approveOne: (merchant: string, employee: string) => string;
  rejectOne: (merchant: string, employee: string) => string;
  recentDecisions: string;
  /** The badge word of each audit action. */
  actions: Record<AuditAction, string>;
  /** One line of the trail: who did what to which expense; `amount` is absent if it is gone. */
  trailLine: (
    actor: ReactNode,
    action: AuditAction,
    merchant: string | undefined,
    amount: ReactNode,
  ) => ReactNode;
  reasonLine: (reason: string) => string;
  undo: string;
  undoLabel: (merchant: string) => string;
  rejectManyTitle: (count: number) => string;
  rejectOneTitle: (merchant: string) => string;
  rejectManyNote: (total: ReactNode) => ReactNode;
  rejectOneNote: (employee: string, amount: ReactNode) => ReactNode;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonHint: string;
  reasonMissing: string;
  reasonTooShort: (minimum: number) => string;
  cancel: string;
  confirmReject: string;
  /** The dialog's close button. */
  close: string;
}

const PAST: Record<AuditAction, string> = {
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
  reopened: 'reopened',
};

export const EXPENSE_APPROVAL_MESSAGES: ExpenseApprovalMessages = {
  ...COMMON_MESSAGES,
  title: 'Expense approvals',
  statusLabel: 'Status',
  views: { pending: 'Waiting', approved: 'Approved', rejected: 'Rejected', all: 'All' },
  viewSummary: (view, count, total) => (
    <>
      {count} {view === 'all' ? (count === 1 ? 'expense' : 'expenses') : view}, {total} in total
    </>
  ),
  viewEmptyTitle: (view) =>
    view === 'approved'
      ? 'Nothing approved yet'
      : view === 'rejected'
        ? 'Nothing rejected'
        : 'No expenses yet',
  viewEmptyNote: 'Decided expenses are listed here with who decided them and when.',
  viewCaption: (view, currency) => `${view} expenses, amounts in ${currency}`,
  decisionLine: (action, actor, date) =>
    `${action === 'approved' ? 'Approved' : 'Rejected'} by ${actor}, ${date}`,
  reopen: 'Reopen',
  reopenOne: (merchant, employee) => `Reopen ${merchant}, ${employee}`,
  summary: (count, total) => (
    <>
      {count} waiting, {total} in total
    </>
  ),
  nothingWaiting: 'Nothing waiting for you',
  selectAll: 'Select all pending expenses',
  selectHint: 'Select to decide several at once',
  selected: (count, total) => (
    <>
      {count} selected, {total}
    </>
  ),
  rejectMany: (count) => `Reject ${String(count)}`,
  approveMany: (count) => `Approve ${String(count)}`,
  emptyTitle: 'You are all caught up',
  emptyNote: 'New expenses appear here when they are submitted.',
  tableCaption: (currency) => `Pending expenses, amounts in ${currency}`,
  select: 'Select',
  expense: 'Expense',
  category: 'Category',
  amount: 'Amount',
  decision: 'Decision',
  selectOne: (merchant, employee) => `Select ${merchant}, ${employee}`,
  approve: 'Approve',
  reject: 'Reject',
  approveOne: (merchant, employee) => `Approve ${merchant}, ${employee}`,
  rejectOne: (merchant, employee) => `Reject ${merchant}, ${employee}`,
  recentDecisions: 'Recent decisions',
  actions: PAST,
  trailLine: (actor, action, merchant, amount) => (
    <>
      <span className="font-medium">{actor}</span> {PAST[action]} {merchant ?? 'an expense'}
      {amount !== undefined && <>, {amount}</>}
    </>
  ),
  reasonLine: (reason) => `Reason: ${reason}`,
  undo: 'Undo',
  undoLabel: (merchant) => `Undo, return ${merchant} to pending`,
  rejectManyTitle: (count) => `Reject ${String(count)} expenses`,
  rejectOneTitle: (merchant) => `Reject ${merchant}`,
  rejectManyNote: (total) => <>{total} in total. Every employee gets the same reason.</>,
  rejectOneNote: (employee, amount) => (
    <>
      {employee}, {amount}. The employee sees your reason.
    </>
  ),
  reasonLabel: 'Reason',
  reasonPlaceholder: 'For example: receipt missing, resubmit with it attached',
  reasonHint: 'Saved in the audit trail with your name.',
  reasonMissing: 'Say why, so the employee knows what to fix.',
  reasonTooShort: (minimum) => `Write at least ${String(minimum)} characters.`,
  cancel: 'Cancel',
  confirmReject: 'Reject',
  close: 'Close',
};

/**
 * The approver's queue: pending expenses with their policy flags, approve or reject one or many,
 * a required reason for every rejection, and a trail of who decided what and when. The block holds
 * only the selection and the dialog; decisions go to your callbacks (or `approvalReducer`).
 */
export function ExpenseApproval({
  requests,
  events,
  currency,
  locale: requestedLocale,
  onApprove,
  onReject,
  onReopen,
  status,
  defaultStatus = 'pending',
  onStatusChange,
  statusFilter = true,
  trailLength = 5,
  title,
  emptyAction,
  messages,
  className,
}: ExpenseApprovalProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(EXPENSE_APPROVAL_MESSAGES, messages);
  const { Button, Money, Rows, Row } = useBlockParts();
  const [viewState, setViewState] = useState<ApprovalView>(defaultStatus);
  const view = status ?? viewState;
  const setView = (next: ApprovalView) => {
    if (status === undefined) setViewState(next);
    onStatusChange?.(next);
  };
  const counts = viewCounts(requests);
  const shown = requestsInView(requests, view);
  // The rows that can still be decided, in this view: the whole queue, or none of a decided view.
  const pending = shown.filter((r) => r.status === 'pending');
  const decisions = standingDecisions(events);
  const day = (date: Date) => formatShortDate(date, locale);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  /**
   * One Approve is filled at a time: on the row under the pointer or holding focus, else the first
   * row. The rest stay outlined in the accent, still the main action of their row, so a queue of
   * six reads as six decisions rather than six alarms.
   */
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const lead = [hovered, focused, pending[0]?.id].find(
    (id) => id != null && pending.some((r) => r.id === id),
  );
  // Selection never outlives the requests it points at.
  const chosen = pending.filter((r) => selected.has(r.id));
  const all = pending.length > 0 && chosen.length === pending.length;
  const total = sumMoney(
    pending.map((r) => r.amount),
    currency,
  );
  const byId = new Map(requests.map((r) => [r.id, r]));
  // The trail sits under the queue; a decided view already shows each decision on its row.
  const trail = view === 'pending' ? [...events].reverse().slice(0, trailLength) : [];

  const toggle = (id: string, on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const approve = (ids: string[]) => {
    onApprove(ids);
    setSelected((current) => new Set([...current].filter((id) => !ids.includes(id))));
  };

  return (
    <BlockPanel
      title={title ?? m.title}
      description={
        view !== 'pending'
          ? m.viewSummary(
              view,
              shown.length,
              <Money
                amount={sumMoney(
                  shown.map((r) => r.amount),
                  currency,
                )}
                currency={currency}
                locale={locale}
              />,
            )
          : pending.length === 0
            ? m.nothingWaiting
            : m.summary(
                pending.length,
                <Money amount={total} currency={currency} locale={locale} />,
              )
      }
      className={className}
      bodyClassName="gap-5"
    >
      {statusFilter && (
        <Segmented<ApprovalView>
          label={m.statusLabel}
          value={view}
          onValueChange={(next) => {
            setView(next);
            setSelected(new Set());
          }}
          options={APPROVAL_VIEWS.map((value) => ({
            value,
            label: m.views[value],
            hint: counts[value],
          }))}
        />
      )}
      {/* Bulk actions sit where the eye already is: on top of the list they act on. */}
      <div
        className={cn(
          'flex min-h-(--rx-control-height-md) flex-wrap items-center justify-between gap-3 rounded-control bg-surface-sunken px-3 py-1.5',
          pending.length === 0 && 'hidden',
        )}
      >
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <Checkbox
            aria-label={m.selectAll}
            checked={all}
            indeterminate={chosen.length > 0 && !all}
            disabled={pending.length === 0}
            onCheckedChange={(checked) => {
              setSelected(checked ? new Set(pending.map((r) => r.id)) : new Set());
            }}
          />
          <span aria-live="polite">
            {chosen.length === 0 ? (
              <span className="text-fg-muted">{m.selectHint}</span>
            ) : (
              m.selected(
                chosen.length,
                <Money
                  amount={sumMoney(
                    chosen.map((r) => r.amount),
                    currency,
                  )}
                  currency={currency}
                  locale={locale}
                  className="font-medium"
                />,
              )
            )}
          </span>
        </label>
        {chosen.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setRejecting(chosen.map((r) => r.id));
              }}
            >
              <XIcon aria-hidden weight="bold" className="size-3.5" />
              {m.rejectMany(chosen.length)}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                approve(chosen.map((r) => r.id));
              }}
            >
              <CheckIcon aria-hidden weight="bold" className="size-3.5" />
              {m.approveMany(chosen.length)}
            </Button>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        view === 'pending' ? (
          <EmptyNote title={m.emptyTitle} action={emptyAction} icon={CheckCircleIcon}>
            {m.emptyNote}
          </EmptyNote>
        ) : (
          <EmptyNote title={m.viewEmptyTitle(view)} icon={ClockCounterClockwiseIcon}>
            {m.viewEmptyNote}
          </EmptyNote>
        )
      ) : (
        <Table>
          <TableCaption className="sr-only">
            {view === 'pending' ? m.tableCaption(currency) : m.viewCaption(m.views[view], currency)}
          </TableCaption>
          <TableHeader>
            <TableRow>
              {pending.length > 0 && (
                <TableHead className="w-0 pe-0">
                  <span className="sr-only">{m.select}</span>
                </TableHead>
              )}
              <TableHead>{m.expense}</TableHead>
              <TableHead className="hidden @2xl:table-cell">{m.category}</TableHead>
              <TableHead align="end" className="hidden @xl:table-cell">
                {m.amount}
              </TableHead>
              <TableHead align="end" className="hidden w-0 @xl:table-cell">
                <span className="sr-only">{m.decision}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Rows>
              {shown.map((request) => {
                const open = request.status === 'pending';
                const decision = decisions.get(request.id);
                const verdict = !open && (
                  <DecidedActions
                    request={request}
                    messages={m}
                    onReopen={
                      onReopen === undefined
                        ? undefined
                        : () => {
                            onReopen(request.id);
                          }
                    }
                  />
                );
                return (
                  <Row
                    key={request.id}
                    data-selected={selected.has(request.id) || undefined}
                    onPointerEnter={() => {
                      setHovered(request.id);
                    }}
                    onPointerLeave={() => {
                      setHovered((id) => (id === request.id ? null : id));
                    }}
                    onFocus={() => {
                      setFocused(request.id);
                    }}
                    onBlur={(event) => {
                      if (event.currentTarget.contains(event.relatedTarget)) return;
                      setFocused((id) => (id === request.id ? null : id));
                    }}
                  >
                    {pending.length > 0 && (
                      <TableCell className="w-0 pe-0">
                        {open && (
                          <span className="flex items-center">
                            <Checkbox
                              aria-label={m.selectOne(request.merchant, request.employee)}
                              checked={selected.has(request.id)}
                              onCheckedChange={(checked) => {
                                toggle(request.id, checked);
                              }}
                            />
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {/* Narrow: the amount joins the merchant's line, leaving the row's width to the decision. */}
                      <span className="flex items-baseline justify-between gap-3 font-medium">
                        {request.merchant}
                        <Money
                          amount={request.amount}
                          currency={currency}
                          locale={locale}
                          className="@xl:hidden"
                        />
                      </span>
                      <span className="block text-sm text-fg-muted">
                        {request.employee},{' '}
                        <span className="numeric">{formatShortDate(request.date, locale)}</span>
                        <span className="@2xl:hidden">, {request.category}</span>
                      </span>
                      {decision !== undefined && !open && (
                        <span className="block text-sm text-fg-muted">
                          {m.decisionLine(
                            decision.action === 'approved' ? 'approved' : 'rejected',
                            decision.actor,
                            day(decision.at),
                          )}
                          {decision.reason !== undefined && (
                            <span className="block">{m.reasonLine(decision.reason)}</span>
                          )}
                        </span>
                      )}
                      {open && request.flags !== undefined && request.flags.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {request.flags.map((flag) => (
                            <Badge key={flag} tone="warning">
                              <FlagIcon aria-hidden weight="bold" />
                              {flag}
                            </Badge>
                          ))}
                        </span>
                      )}
                      {/* Narrow: the decision sits under the expense, where the thumb reaches it. */}
                      <span className="mt-2 flex @xl:hidden">
                        {open ? (
                          <Decide
                            wide
                            lead={request.id === lead}
                            messages={m}
                            request={request}
                            onApprove={() => {
                              approve([request.id]);
                            }}
                            onReject={() => {
                              setRejecting([request.id]);
                            }}
                          />
                        ) : (
                          verdict
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-fg-muted @2xl:table-cell">
                      {request.category}
                    </TableCell>
                    <TableCell align="end" className="hidden @xl:table-cell">
                      <Money amount={request.amount} currency={currency} locale={locale} />
                    </TableCell>
                    <TableCell align="end" className="hidden w-0 @xl:table-cell">
                      {open ? (
                        <Decide
                          lead={request.id === lead}
                          messages={m}
                          request={request}
                          onApprove={() => {
                            approve([request.id]);
                          }}
                          onReject={() => {
                            setRejecting([request.id]);
                          }}
                        />
                      ) : (
                        verdict
                      )}
                    </TableCell>
                  </Row>
                );
              })}
            </Rows>
          </TableBody>
        </Table>
      )}

      {trail.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <ClockCounterClockwiseIcon aria-hidden weight="bold" className="size-4 text-fg-muted" />
            {m.recentDecisions}
          </h3>
          <ol className="flex flex-col">
            {trail.map((event) => {
              const request = byId.get(event.requestId);
              const decided = request !== undefined && request.status !== 'pending';
              const latest =
                events.findLast((e) => e.requestId === event.requestId)?.id === event.id;
              return (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-b-0"
                >
                  <span className="flex min-w-0 items-start gap-2.5 text-sm">
                    {event.action === 'approved' || event.action === 'rejected' ? (
                      <StateBadge state={event.action} label={m.states[event.action]} />
                    ) : (
                      <Badge>{m.actions[event.action]}</Badge>
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span>
                        {m.trailLine(
                          event.actor,
                          event.action,
                          request?.merchant,
                          request === undefined ? undefined : (
                            <Money amount={request.amount} currency={currency} locale={locale} />
                          ),
                        )}
                      </span>
                      {event.reason !== undefined && (
                        <span className="text-fg-muted">{m.reasonLine(event.reason)}</span>
                      )}
                      <span className="text-fg-subtle">
                        <time dateTime={event.at.toISOString()}>
                          {new Intl.DateTimeFormat(locale, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(event.at)}
                        </time>
                      </span>
                    </span>
                  </span>
                  {onReopen !== undefined && decided && latest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={m.undoLabel(request.merchant)}
                      onClick={() => {
                        onReopen(event.requestId);
                      }}
                    >
                      <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
                      {m.undo}
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <RejectDialog
        messages={m}
        requests={rejecting === null ? [] : rejecting.flatMap((id) => byId.get(id) ?? [])}
        currency={currency}
        locale={locale}
        onCancel={() => {
          setRejecting(null);
        }}
        onConfirm={(reason) => {
          if (rejecting === null) return;
          onReject(rejecting, reason);
          setSelected((current) => new Set([...current].filter((id) => !rejecting.includes(id))));
          setRejecting(null);
        }}
      />
    </BlockPanel>
  );
}

/** A decided request's standing: its badge, and Reopen when the app allows it. */
function DecidedActions({
  request,
  messages: m,
  onReopen,
}: {
  request: ExpenseRequest;
  messages: ExpenseApprovalMessages;
  onReopen: (() => void) | undefined;
}) {
  const { Button } = useBlockParts();
  const state = request.status === 'approved' ? 'approved' : 'rejected';
  return (
    <span className="flex w-full items-center justify-between gap-2 @xl:w-auto @xl:justify-end">
      <StateBadge state={state} label={m.states[state]} />
      {onReopen !== undefined && (
        <Button
          variant="ghost"
          size="sm"
          aria-label={m.reopenOne(request.merchant, request.employee)}
          onClick={onReopen}
        >
          <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
          {m.reopen}
        </Button>
      )}
    </span>
  );
}

/**
 * Reject and approve for one request. Approve is the primary action, the one an approver takes
 * most; reject is the secondary one beside it, worded and asking for a reason in its dialog.
 */
function Decide({
  request,
  onApprove,
  onReject,
  lead,
  messages: m,
  wide = false,
}: {
  request: ExpenseRequest;
  onApprove: () => void;
  onReject: () => void;
  /** The row whose Approve is filled; every other row's is outlined in the accent. */
  lead: boolean;
  messages: ExpenseApprovalMessages;
  /** Narrow rows: the two buttons share the row's width, in reach of either thumb. */
  wide?: boolean;
}) {
  const { Button } = useBlockParts();
  const share = wide ? 'flex-1' : '';
  return (
    <span
      className={cn('flex items-center justify-end gap-2 pointer-coarse:gap-3', wide && 'w-full')}
    >
      {/* Named in words: a bare cross reads as dismiss, and rejecting asks for a reason. */}
      <Button
        variant="secondary"
        size="sm"
        aria-label={m.rejectOne(request.merchant, request.employee)}
        className={share}
        onClick={onReject}
      >
        <XIcon aria-hidden weight="bold" className="size-3.5" />
        {m.reject}
      </Button>
      <Button
        variant={lead ? 'primary' : 'secondary'}
        size="sm"
        aria-label={m.approveOne(request.merchant, request.employee)}
        data-lead={lead || undefined}
        className={cn(
          share,
          // Outlined in the accent: still the row's main action, without six fills in a column.
          // The filled one keeps a clear border of the same width, so the row never shifts as the
          // lead moves from row to row.
          lead
            ? 'border border-transparent'
            : 'border-accent text-accent-strong hover:bg-accent-subtle',
        )}
        onClick={onApprove}
      >
        <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        {m.approve}
      </Button>
    </span>
  );
}

function RejectDialog({
  messages: m,
  requests,
  currency,
  locale,
  onCancel,
  onConfirm,
}: {
  messages: ExpenseApprovalMessages;
  requests: ExpenseRequest[];
  currency: string;
  locale: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { Button, Money } = useBlockParts();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const problem = reasonProblem(reason);
  const error =
    problem === 'missing'
      ? m.reasonMissing
      : problem === 'short'
        ? m.reasonTooShort(MIN_REASON_LENGTH)
        : null;
  const open = requests.length > 0;
  // While the dialog closes, it keeps showing what it was about instead of an empty title.
  const [shown, setShown] = useState(requests);
  const key = requests.map((r) => r.id).join();
  if (open && key !== shown.map((r) => r.id).join()) setShown(requests);
  const one = shown.length === 1 ? shown[0] : undefined;

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault();
    setTried(true);
    if (error !== null) return;
    onConfirm(reason.trim());
  };
  /**
   * The form empties once the dialog has finished closing, never during its exit: clearing the
   * reason or its error while the popup still fades away flashes a changed form.
   */
  const onOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen) return;
    setReason('');
    setTried(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogContent closeLabel={m.close}>
        <form onSubmit={submit} onKeyDown={onKeyDown} noValidate>
          <DialogHeader>
            <DialogTitle>
              {one === undefined ? m.rejectManyTitle(shown.length) : m.rejectOneTitle(one.merchant)}
            </DialogTitle>
            <DialogDescription>
              {one === undefined
                ? m.rejectManyNote(
                    <Money
                      amount={sumMoney(
                        shown.map((r) => r.amount),
                        currency,
                      )}
                      currency={currency}
                      locale={locale}
                    />,
                  )
                : m.rejectOneNote(
                    one.employee,
                    <Money amount={one.amount} currency={currency} locale={locale} />,
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field invalid={tried && error !== null}>
              <FieldLabel>{m.reasonLabel}</FieldLabel>
              <Input
                autoFocus
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                }}
                placeholder={m.reasonPlaceholder}
              />
              {tried && error !== null ? (
                <FieldError>{error}</FieldError>
              ) : (
                <FieldDescription>{m.reasonHint}</FieldDescription>
              )}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onCancel}>
              {m.cancel}
            </Button>
            <Button type="submit" variant="danger">
              {m.confirmReject}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
