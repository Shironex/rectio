'use client';

import {
  CalendarCheckIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  ProhibitIcon,
  UsersThreeIcon,
  XCircleIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react';
import { Badge, SkeletonListItem, cn, type BadgeTone } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { BlockPanel } from '../../lib/block-panel';
import { useBlockParts } from '../../lib/block-parts';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { ChoiceSelect } from '../../lib/choice-select';
import { Segmented } from '../../lib/segmented';
import { ConfirmDialog, type ConfirmRequest } from '../lib/confirm';
import { toIsoDay, type IsoDay } from '../lib/days';
import { formatDate, formatDayRange, formatDays } from '../lib/format';
import { PersonAvatar } from '../lib/person';
import { LEAVE_REQUESTS_MESSAGES, type LeaveRequestsMessages } from './leave-requests-messages';
import {
  LEAVE_FILTERS,
  leaveBalances,
  leaveCounts,
  leaveHalves,
  leaveInView,
  leaveOverlaps,
  overlapPeople,
  type LeaveBalance,
  type LeaveFilter,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from './leave-requests.logic';

const LEAVE_STATUS: Record<LeaveStatus, { tone: BadgeTone; icon: Icon }> = {
  pending: { tone: 'warning', icon: ClockIcon },
  approved: { tone: 'positive', icon: CheckCircleIcon },
  declined: { tone: 'negative', icon: XCircleIcon },
  cancelled: { tone: 'neutral', icon: ProhibitIcon },
};

export function LeaveStatusBadge({ status, label }: { status: LeaveStatus; label: string }) {
  const { tone, icon: StatusIcon } = LEAVE_STATUS[status];
  return (
    <Badge tone={tone}>
      <StatusIcon aria-hidden weight="bold" />
      {label}
    </Badge>
  );
}

export interface LeaveRequestsProps {
  requests: readonly LeaveRequest[];
  types: readonly LeaveType[];
  /** The approver's view: approve a pending request, after a confirm that names any overlap. */
  onApprove?: ((request: LeaveRequest) => void) | undefined;
  /** The approver's view: decline a pending request with a reason. */
  onDecline?: ((request: LeaveRequest, reason: string) => void) | undefined;
  /** The requester's view: cancel a pending request, or an approved one that has not started. */
  onCancel?: ((request: LeaveRequest, reason: string) => void) | undefined;
  /** Shows each person's name and picture on the rows: on in the approver's view. */
  showPerson?: boolean | undefined;
  /** Shows this person's balance by type above the list. */
  balanceFor?: string | undefined;
  /** Other leave to check overlaps against, such as the team's calendar; the list itself counts too. */
  team?: readonly LeaveRequest[] | undefined;
  filter?: LeaveFilter | undefined;
  defaultFilter?: LeaveFilter | undefined;
  onFilterChange?: ((filter: LeaveFilter) => void) | undefined;
  /** Weekend days, 0 for Sunday; Saturday and Sunday by default. */
  weekend?: readonly number[] | undefined;
  holidays?: Readonly<Record<IsoDay, string>> | undefined;
  /** Today, for what can still be cancelled. The current date by default. */
  today?: IsoDay | undefined;
  locale?: string | undefined;
  title?: string | undefined;
  /** On the title row, such as a Request leave button. */
  actions?: ReactNode;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | undefined;
  messages?: Partial<LeaveRequestsMessages> | undefined;
  className?: string | undefined;
}

/**
 * Leave requests with their status: pending, approved, declined or cancelled. Approvers approve or
 * decline with a confirm that names the teammates already off on those days; requesters cancel. A
 * balance per type can sit above the list. Days are working days, with weekends and holidays left
 * out and half days counted as halves.
 */
export function LeaveRequests({
  requests,
  types,
  onApprove,
  onDecline,
  onCancel,
  showPerson = true,
  balanceFor,
  team = [],
  filter,
  defaultFilter = 'pending',
  onFilterChange,
  weekend,
  holidays,
  today: todayProp,
  locale: requestedLocale,
  title,
  actions,
  loading = false,
  headingLevel,
  messages,
  className,
}: LeaveRequestsProps) {
  const m = mergeMessages(LEAVE_REQUESTS_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const today = todayProp ?? toIsoDay(new Date());
  const calendar = { weekend, holidays };
  const [filterState, setFilterState] = useState<LeaveFilter>(defaultFilter);
  const view = filter ?? filterState;
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const counts = leaveCounts(requests);
  const shown = leaveInView(requests, view);
  const everyone = [...requests, ...team.filter((t) => !requests.some((r) => r.id === t.id))];
  const typeLabel = (id: string) => types.find((type) => type.id === id)?.label ?? id;
  const daysText = (halves: number) => m.days(formatDays(halves, locale), halves);
  const balances =
    balanceFor === undefined ? [] : leaveBalances(types, requests, balanceFor, calendar);

  const nameOf = (request: LeaveRequest) =>
    m.requestName(
      request.person.name,
      typeLabel(request.type),
      formatDayRange(request.start, request.end, locale, m.range),
    );
  const overlapText = (request: LeaveRequest, long: boolean) => {
    const overlaps = leaveOverlaps(request, everyone, {
      personId: request.person.id,
      exceptId: request.id,
      calendar,
    });
    const people = overlapPeople(overlaps);
    if (people.length === 0) return null;
    const names = people
      .slice(0, 2)
      .map((p) => p.name)
      .join(' and ');
    if (!long) return m.overlapShort(names, Math.max(0, people.length - 2));
    const days = new Set(overlaps.flatMap((o) => o.days)).size;
    return m.overlapLong(people.map((p) => p.name).join(', '), people.length, days);
  };

  const pick = (next: LeaveFilter) => {
    if (filter === undefined) setFilterState(next);
    onFilterChange?.(next);
  };

  return (
    <BlockPanel
      title={title ?? m.title}
      description={m.summary(counts.pending)}
      actions={actions}
      headingLevel={headingLevel ?? 2}
      className={className}
      bodyClassName="gap-5"
    >
      {balances.length > 0 && <LeaveBalances balances={balances} locale={locale} messages={m} />}
      {/* Five filters fit a row on a wide block; a narrow one (a phone) picks from a select. */}
      <div className="hidden @lg:block">
        <Segmented<LeaveFilter>
          label={m.filterLabel}
          value={view}
          onValueChange={pick}
          options={LEAVE_FILTERS.map((value) => ({
            value,
            label: m.filters[value],
            ...(loading ? {} : { hint: counts[value] }),
          }))}
        />
      </div>
      <ChoiceSelect<LeaveFilter>
        label={m.filterLabel}
        value={view}
        onValueChange={pick}
        choices={LEAVE_FILTERS.map((value) => ({
          value,
          label: loading ? m.filters[value] : m.filterCount(m.filters[value], counts[value]),
        }))}
        className="w-full @lg:hidden"
      />
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyNote title={m.emptyTitle(view)} icon={CalendarCheckIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <ul data-slot="leave-list" className="flex flex-col divide-y divide-line">
          {shown.map((request) => {
            const halves = leaveHalves(request, calendar);
            const overlap = request.status === 'pending' ? overlapText(request, false) : null;
            const canCancel =
              onCancel !== undefined &&
              (request.status === 'pending' ||
                (request.status === 'approved' && request.start > today));
            const name = nameOf(request);
            return (
              <li
                key={request.id}
                data-status={request.status}
                className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 @xl:flex-row @xl:items-center @xl:gap-5"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  {showPerson && (
                    <PersonAvatar name={request.person.name} src={request.person.avatar} />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium">
                        {showPerson ? request.person.name : typeLabel(request.type)}
                      </span>
                      {/* In a single-status view every row has the same status: the filter says it. */}
                      {view === 'all' && (
                        <LeaveStatusBadge
                          status={request.status}
                          label={m.status[request.status]}
                        />
                      )}
                    </div>
                    <p className="text-sm text-fg-muted">
                      {showPerson && <>{typeLabel(request.type)}, </>}
                      <span className="numeric">
                        {formatDayRange(request.start, request.end, locale, m.range)}
                      </span>
                      , <span className="font-medium text-fg numeric">{daysText(halves)}</span>
                      {request.halfStart === true && <>, {m.halfStart.toLowerCase()}</>}
                      {request.halfEnd === true && <>, {m.halfEnd.toLowerCase()}</>}
                    </p>
                    {request.note !== undefined && request.note !== '' && (
                      <p className="text-sm text-fg-muted">“{request.note}”</p>
                    )}
                    {overlap !== null && (
                      <p className="flex items-center gap-1.5 text-sm text-warning-strong">
                        <UsersThreeIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />
                        {overlap}
                      </p>
                    )}
                    {request.decision !== undefined && request.status !== 'pending' && (
                      <p className="text-sm text-fg-muted">
                        {request.decision.on !== undefined && (
                          <span className="block">
                            {m.decided(
                              request.status,
                              request.decision.by,
                              formatDate(request.decision.on, locale),
                            )}
                          </span>
                        )}
                        {request.decision.reason !== undefined &&
                          request.decision.reason !== '' && (
                            <span className="block">{m.reason(request.decision.reason)}</span>
                          )}
                      </p>
                    )}
                  </div>
                </div>
                <RequestActions
                  indent={showPerson}
                  request={request}
                  name={name}
                  messages={m}
                  canCancel={canCancel}
                  onApprove={
                    request.status === 'pending' && onApprove !== undefined
                      ? () => {
                          setConfirm({
                            title: m.approveTitle(request.person.name),
                            description: m.approveNote(
                              daysText(halves),
                              overlapText(request, true),
                            ),
                            confirm: m.approveConfirm,
                            cancel: m.back,
                            tone: overlap === null ? 'neutral' : 'warning',
                            onConfirm: () => {
                              onApprove(request);
                            },
                          });
                        }
                      : undefined
                  }
                  onDecline={
                    request.status === 'pending' && onDecline !== undefined
                      ? () => {
                          setConfirm({
                            title: m.declineTitle(request.person.name),
                            description: m.declineNote,
                            confirm: m.declineConfirm,
                            cancel: m.back,
                            tone: 'danger',
                            reason: {
                              label: m.reasonLabel,
                              required: true,
                              missing: m.reasonMissing,
                            },
                            onConfirm: (reason) => {
                              onDecline(request, reason);
                            },
                          });
                        }
                      : undefined
                  }
                  onCancel={
                    canCancel
                      ? () => {
                          setConfirm({
                            title: m.cancelTitle,
                            description: m.cancelNote(daysText(halves)),
                            confirm: m.cancelConfirm,
                            cancel: m.keep,
                            tone: 'danger',
                            reason: { label: m.reasonOptional, missing: m.reasonMissing },
                            onConfirm: (reason) => {
                              onCancel(request, reason);
                            },
                          });
                        }
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        request={confirm}
        onClose={() => {
          setConfirm(null);
        }}
      />
    </BlockPanel>
  );
}

function RequestActions({
  indent,
  name,
  messages: m,
  onApprove,
  onDecline,
  onCancel,
}: {
  /** Lines the buttons up under the text on a narrow block, past the avatar. */
  indent: boolean;
  request: LeaveRequest;
  name: string;
  messages: LeaveRequestsMessages;
  canCancel: boolean;
  onApprove: (() => void) | undefined;
  onDecline: (() => void) | undefined;
  onCancel: (() => void) | undefined;
}) {
  const { Button } = useBlockParts();
  if (onApprove === undefined && onDecline === undefined && onCancel === undefined) return null;
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-2 pointer-coarse:gap-touch-gap',
        indent && 'ps-11 @xl:ps-0',
      )}
    >
      {onCancel !== undefined && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onCancel}
          aria-label={`${m.cancelRequest}: ${name}`}
        >
          <ProhibitIcon aria-hidden weight="bold" className="size-3.5" />
          {m.cancelRequest}
        </Button>
      )}
      {onDecline !== undefined && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onDecline}
          aria-label={`${m.decline}: ${name}`}
        >
          <XIcon aria-hidden weight="bold" className="size-3.5" />
          {m.decline}
        </Button>
      )}
      {onApprove !== undefined && (
        <Button size="sm" onClick={onApprove} aria-label={`${m.approve}: ${name}`}>
          <CheckIcon aria-hidden weight="bold" className="size-3.5" />
          {m.approve}
        </Button>
      )}
    </div>
  );
}

/** Each type's balance: what is left in large figures, what is taken and waiting under it. */
export function LeaveBalances({
  balances,
  locale,
  messages: m,
  className,
}: {
  balances: readonly LeaveBalance[];
  locale: string;
  messages: LeaveRequestsMessages;
  className?: string | undefined;
}) {
  const days = (halves: number) => m.days(formatDays(halves, locale), halves);
  return (
    <dl
      aria-label={m.balances}
      data-slot="leave-balances"
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line @xl:grid-cols-4',
        className,
      )}
    >
      {balances.map((balance) => (
        <div key={balance.type.id} className="flex flex-col gap-1 bg-surface px-4 py-3">
          <dt className="text-sm text-fg-muted">{balance.type.label}</dt>
          <dd className="flex flex-col gap-0.5">
            <span
              className={cn(
                'font-display text-xl font-heading tracking-tight numeric',
                balance.left !== null && balance.left < 0 && 'text-negative-strong',
              )}
            >
              {balance.left === null ? m.unlimited : `${days(balance.left)} ${m.left}`}
            </span>
            <span className="text-xs text-fg-muted numeric">
              {m.balanceDetail(
                formatDays(balance.taken, locale),
                formatDays(balance.pending, locale),
                balance.allowance === null ? null : formatDays(balance.allowance, locale),
              )}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
