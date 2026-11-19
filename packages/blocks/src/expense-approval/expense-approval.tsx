import {
  ArrowCounterClockwiseIcon,
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
} from '@rectio/ui';
import { useState, type SyntheticEvent, type KeyboardEvent } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { formatShortDate, resolveLocale, sumMoney } from '../lib/finance';
import { StateBadge } from '../lib/state-badge';
import { reasonError, type AuditEvent, type ExpenseRequest } from './expense-approval.logic';

export interface ExpenseApprovalProps {
  requests: readonly ExpenseRequest[];
  /** The audit trail, oldest first. The newest decisions are shown. */
  events: readonly AuditEvent[];
  currency: string;
  locale?: string;
  onApprove: (ids: string[]) => void;
  onReject: (ids: string[], reason: string) => void;
  /** Offers Undo on decided requests in the trail. */
  onReopen?: (id: string) => void;
  /** How many decisions the trail shows. */
  trailLength?: number;
  title?: string;
  className?: string;
}

const ACTION_WORDS: Record<AuditEvent['action'], string> = {
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
  reopened: 'reopened',
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
  trailLength = 5,
  title = 'Expense approvals',
  className,
}: ExpenseApprovalProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button, Money, Rows, Row } = useBlockParts();
  const pending = requests.filter((r) => r.status === 'pending');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  // Selection never outlives the requests it points at.
  const chosen = pending.filter((r) => selected.has(r.id));
  const all = pending.length > 0 && chosen.length === pending.length;
  const total = sumMoney(
    pending.map((r) => r.amount),
    currency,
  );
  const byId = new Map(requests.map((r) => [r.id, r]));
  const trail = [...events].reverse().slice(0, trailLength);

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
      title={title}
      description={
        pending.length === 0 ? (
          'Nothing waiting for you'
        ) : (
          <>
            {pending.length} waiting, <Money amount={total} currency={currency} locale={locale} />{' '}
            in total
          </>
        )
      }
      className={className}
      bodyClassName="gap-5"
    >
      {/* Bulk actions sit where the eye already is: on top of the list they act on. */}
      <div className="flex min-h-(--rx-control-height-md) flex-wrap items-center justify-between gap-3 rounded-control bg-surface-sunken px-3 py-1.5">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <Checkbox
            aria-label="Select all pending expenses"
            checked={all}
            indeterminate={chosen.length > 0 && !all}
            disabled={pending.length === 0}
            onCheckedChange={(checked) => {
              setSelected(checked ? new Set(pending.map((r) => r.id)) : new Set());
            }}
          />
          <span aria-live="polite">
            {chosen.length === 0 ? (
              <span className="text-fg-muted">Select to decide several at once</span>
            ) : (
              <>
                {chosen.length} selected,{' '}
                <Money
                  amount={sumMoney(
                    chosen.map((r) => r.amount),
                    currency,
                  )}
                  currency={currency}
                  locale={locale}
                  className="font-medium"
                />
              </>
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
              Reject {chosen.length}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                approve(chosen.map((r) => r.id));
              }}
            >
              <CheckIcon aria-hidden weight="bold" className="size-3.5" />
              Approve {chosen.length}
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableCaption className="sr-only">Pending expenses, amounts in {currency}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0 pe-0">
              <span className="sr-only">Select</span>
            </TableHead>
            <TableHead>Expense</TableHead>
            <TableHead className="hidden @2xl:table-cell">Category</TableHead>
            <TableHead align="end">Amount</TableHead>
            <TableHead align="end" className="hidden w-0 @xl:table-cell">
              <span className="sr-only">Decision</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Rows>
            {pending.map((request) => (
              <Row key={request.id} data-selected={selected.has(request.id) || undefined}>
                <TableCell className="w-0 pe-0">
                  <span className="flex items-center">
                    <Checkbox
                      aria-label={`Select ${request.merchant}, ${request.employee}`}
                      checked={selected.has(request.id)}
                      onCheckedChange={(checked) => {
                        toggle(request.id, checked);
                      }}
                    />
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block font-medium">{request.merchant}</span>
                  <span className="block text-sm text-fg-muted">
                    {request.employee},{' '}
                    <span className="numeric">{formatShortDate(request.date, locale)}</span>
                    <span className="@2xl:hidden">, {request.category}</span>
                  </span>
                  {request.flags !== undefined && request.flags.length > 0 && (
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
                    <Decide
                      request={request}
                      onApprove={() => {
                        approve([request.id]);
                      }}
                      onReject={() => {
                        setRejecting([request.id]);
                      }}
                    />
                  </span>
                </TableCell>
                <TableCell className="hidden text-fg-muted @2xl:table-cell">
                  {request.category}
                </TableCell>
                <TableCell align="end">
                  <Money amount={request.amount} currency={currency} locale={locale} />
                </TableCell>
                <TableCell align="end" className="hidden w-0 @xl:table-cell">
                  <Decide
                    request={request}
                    onApprove={() => {
                      approve([request.id]);
                    }}
                    onReject={() => {
                      setRejecting([request.id]);
                    }}
                  />
                </TableCell>
              </Row>
            ))}
          </Rows>
          {pending.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-auto py-10 text-center text-fg-muted">
                <span className="block font-medium text-fg">You are all caught up</span>
                New expenses appear here when they are submitted.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {trail.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <ClockCounterClockwiseIcon aria-hidden weight="bold" className="size-4 text-fg-muted" />
            Recent decisions
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
                      <StateBadge state={event.action} />
                    ) : (
                      <Badge>{ACTION_WORDS[event.action]}</Badge>
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span>
                        <span className="font-medium">{event.actor}</span>{' '}
                        {ACTION_WORDS[event.action]} {request?.merchant ?? 'an expense'}
                        {request !== undefined && (
                          <>
                            , <Money amount={request.amount} currency={currency} locale={locale} />
                          </>
                        )}
                      </span>
                      {event.reason !== undefined && (
                        <span className="text-fg-muted">Reason: {event.reason}</span>
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
                      aria-label={`Undo, return ${request.merchant} to pending`}
                      onClick={() => {
                        onReopen(event.requestId);
                      }}
                    >
                      <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
                      Undo
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <RejectDialog
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

/** Reject and approve for one request: icon-only reject beside a worded approve. */
function Decide({
  request,
  onApprove,
  onReject,
}: {
  request: ExpenseRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { Button } = useBlockParts();
  const name = `${request.merchant}, ${request.employee}`;
  return (
    <span className="flex items-center justify-end gap-2 pointer-coarse:gap-3">
      <Button
        variant="secondary"
        size="sm"
        iconOnly
        aria-label={`Reject ${name}`}
        onClick={onReject}
      >
        <XIcon aria-hidden weight="bold" className="size-3.5" />
      </Button>
      <Button variant="secondary" size="sm" aria-label={`Approve ${name}`} onClick={onApprove}>
        <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        Approve
      </Button>
    </span>
  );
}

function RejectDialog({
  requests,
  currency,
  locale,
  onCancel,
  onConfirm,
}: {
  requests: ExpenseRequest[];
  currency: string;
  locale: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { Button, Money } = useBlockParts();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const error = reasonError(reason);
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
        if (!next) {
          onCancel();
          setTried(false);
        }
      }}
    >
      <DialogContent>
        <form onSubmit={submit} onKeyDown={onKeyDown} noValidate>
          <DialogHeader>
            <DialogTitle>
              {one === undefined
                ? `Reject ${String(shown.length)} expenses`
                : `Reject ${one.merchant}`}
            </DialogTitle>
            <DialogDescription>
              {one === undefined ? (
                <>
                  <Money
                    amount={sumMoney(
                      shown.map((r) => r.amount),
                      currency,
                    )}
                    currency={currency}
                    locale={locale}
                  />{' '}
                  in total. Every employee gets the same reason.
                </>
              ) : (
                <>
                  {one.employee}, <Money amount={one.amount} currency={currency} locale={locale} />.
                  The employee sees your reason.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field invalid={tried && error !== null}>
              <FieldLabel>Reason</FieldLabel>
              <Input
                autoFocus
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                }}
                placeholder="For example: receipt missing, resubmit with it attached"
              />
              {tried && error !== null ? (
                <FieldError>{error}</FieldError>
              ) : (
                <FieldDescription>Saved in the audit trail with your name.</FieldDescription>
              )}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
