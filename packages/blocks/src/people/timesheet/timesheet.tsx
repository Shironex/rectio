'use client';

import {
  ArrowCounterClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  ClockIcon,
  LockSimpleIcon,
  NotePencilIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import {
  Alert,
  Badge,
  SkeletonTable,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  TimeField,
  cn,
  type BadgeTone,
} from '@rectio/ui';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { BlockPanel } from '../../lib/block-panel';
import { useBlockParts } from '../../lib/block-parts';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { ConfirmDialog, type ConfirmRequest } from '../lib/confirm';
import { addDays, toIsoDay, type IsoDay } from '../lib/days';
import {
  formatDay,
  formatDayLong,
  formatDayNumber,
  formatDayRange,
  formatWeekday,
} from '../lib/format';
import { TIMESHEET_MESSAGES, type TimesheetMessages } from './timesheet-messages';
import {
  cellMinutes,
  formatDuration,
  isEditable,
  parseDuration,
  timesheetTotals,
  type DayFlag,
  type TimeEntry,
  type TimesheetDay,
  type TimesheetRow,
  type TimesheetStatus,
} from './timesheet.logic';

export interface TimesheetReview {
  /** Who submitted, approved or sent the week back, as the status needs. */
  by: string;
  /** The day it happened. */
  on?: IsoDay | undefined;
  /** The approver's reason on a week sent back. */
  reason?: string | undefined;
}

export interface TimesheetProps {
  /** The first day of the week shown. */
  weekStart: IsoDay;
  rows: readonly TimesheetRow[];
  status?: TimesheetStatus | undefined;
  /** Closes the week whatever its status, such as after payroll has run. */
  locked?: boolean | undefined;
  /** A cell's new minutes, or null when it is cleared. Without it the cells are read only. */
  onCellChange?: ((rowId: string, day: IsoDay, minutes: number | null) => void) | undefined;
  /** A cell's note, saved when its field loses the focus. Without it notes are read only. */
  onNoteChange?: ((rowId: string, day: IsoDay, note: string) => void) | undefined;
  /** Moves to another week; the arrows show only with this. */
  onWeekChange?: ((weekStart: IsoDay) => void) | undefined;
  /** Sends a draft or a sent back week for approval, after a confirm. */
  onSubmit?: (() => void) | undefined;
  /** Takes a submitted week back to draft. */
  onRecall?: (() => void) | undefined;
  /** The approver's view: approve a submitted week. */
  onApprove?: (() => void) | undefined;
  /** The approver's view: send a submitted week back with a reason. */
  onReject?: ((reason: string) => void) | undefined;
  onAddRow?: (() => void) | undefined;
  /** Who last moved the week on, and the reason on a week sent back. */
  review?: TimesheetReview | undefined;
  /** `decimal` hours (7.5) in a text field, or `clock` hours and minutes (7:30) in a TimeField. */
  entry?: TimeEntry | undefined;
  /** Minutes a working day expects. 480 by default. */
  dailyMinutes?: number | undefined;
  /** Days of the week nobody works, 0 for Sunday. Saturday and Sunday by default. */
  weekend?: readonly number[] | undefined;
  /** Holidays by day, with their names. */
  holidays?: Readonly<Record<IsoDay, string>> | undefined;
  /** Today, for the flags and the column mark. The current date by default. */
  today?: IsoDay | undefined;
  locale?: string | undefined;
  title?: string | undefined;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | undefined;
  messages?: Partial<TimesheetMessages> | undefined;
  className?: string | undefined;
}

const STATUS_TONE: Record<TimesheetStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'info',
  approved: 'positive',
  rejected: 'warning',
};

const FLAG_TONE: Record<DayFlag, string> = {
  over: 'text-warning-strong',
  short: 'text-fg-muted',
  missing: 'text-negative-strong',
};

const cellKey = (rowId: string, day: IsoDay) => `${rowId}|${day}`;

/** The drafts without one cell's, once it is saved or put back. */
function without(drafts: Record<string, Draft>, key: string): Record<string, Draft> {
  return Object.fromEntries(Object.entries(drafts).filter(([k]) => k !== key));
}

interface Draft {
  text: string;
  error: 'invalid' | 'too-long' | null;
}

/**
 * A week of time per project and day: type hours in a grid (or a list of days on a phone), see the
 * row, day and week totals add up to the minute, and the days that ran over, came up short or have
 * nothing yet. A note can sit on any cell. The week moves from draft to submitted to approved;
 * submitted and approved weeks are read only, and an approver can approve or send it back.
 */
export function Timesheet({
  weekStart,
  rows,
  status = 'draft',
  locked = false,
  onCellChange,
  onNoteChange,
  onWeekChange,
  onSubmit,
  onRecall,
  onApprove,
  onReject,
  onAddRow,
  review,
  entry = 'decimal',
  dailyMinutes = 480,
  weekend,
  holidays,
  today: todayProp,
  locale: requestedLocale,
  title,
  loading = false,
  headingLevel,
  messages,
  className,
}: TimesheetProps) {
  const m = mergeMessages(TIMESHEET_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const today = todayProp ?? toIsoDay(new Date());
  const totals = timesheetTotals(rows, weekStart, { dailyMinutes, weekend, holidays, today });
  const editable = isEditable(status, locked) && onCellChange !== undefined;
  const range = formatDayRange(weekStart, addDays(weekStart, 7), locale, m.range);
  const hours = (minutes: number) =>
    m.hours(formatDuration(minutes, locale, entry, { zero: true }));

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [active, setActive] = useState<{ rowId: string; day: IsoDay } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const id = useId();

  const commit = (rowId: string, day: IsoDay, text: string) => {
    const key = cellKey(rowId, day);
    const parsed = parseDuration(text);
    if (!parsed.ok) {
      setDrafts((current) => ({ ...current, [key]: { text, error: parsed.reason } }));
      return false;
    }
    setDrafts((current) => without(current, key));
    const row = rows.find((r) => r.id === rowId);
    const before = row === undefined ? 0 : cellMinutes(row.minutes[day]);
    if ((parsed.minutes ?? 0) !== before) onCellChange?.(rowId, day, parsed.minutes);
    return true;
  };

  const cellProps = (row: TimesheetRow, day: TimesheetDay): CellProps => {
    const key = cellKey(row.id, day.day);
    const minutes = cellMinutes(row.minutes[day.day]);
    const note = row.notes?.[day.day];
    return {
      cellId: `${id}-${key}`,
      label: m.cell(
        row.project + (row.task === undefined ? '' : `, ${row.task}`),
        formatDayLong(day.day, locale),
      ),
      minutes,
      entry,
      locale,
      draft: drafts[key],
      editable,
      hasNote: note !== undefined && note !== '',
      messages: m,
      onFocus: () => {
        setActive({ rowId: row.id, day: day.day });
      },
      onDraft: (text) => {
        setDrafts((current) => ({ ...current, [key]: { text, error: null } }));
      },
      onRevert: () => {
        setDrafts((current) => without(current, key));
      },
      onCommit: (text) => commit(row.id, day.day, text),
      onClockChange: (value) => {
        if (value !== minutes) onCellChange?.(row.id, day.day, value);
      },
    };
  };

  const moveWeek = (by: number) => {
    const next = addDays(weekStart, by * 7);
    onWeekChange?.(next);
    setActive(null);
    setDrafts({});
    setAnnouncement(m.showingWeek(formatDayRange(next, addDays(next, 7), locale, m.range)));
  };

  const activeRow = active === null ? undefined : rows.find((row) => row.id === active.rowId);
  const noteEditor =
    active !== null && activeRow !== undefined ? (
      <NoteEditor
        key={cellKey(active.rowId, active.day)}
        label={m.noteFor(activeRow.project, formatDay(active.day, locale))}
        note={activeRow.notes?.[active.day] ?? ''}
        editable={isEditable(status, locked) && onNoteChange !== undefined}
        messages={m}
        onSave={(note) => {
          onNoteChange?.(active.rowId, active.day, note);
        }}
      />
    ) : null;

  // Every cell holding text that is not a time, said in words under the grid (and read out as it
  // appears), so an invalid cell never rests on its red border alone.
  const errors = Object.entries(drafts).flatMap(([key, draft]) => {
    if (draft.error === null) return [];
    const [rowId = '', day = ''] = key.split('|');
    const row = rows.find((r) => r.id === rowId);
    if (row === undefined) return [];
    const name = row.task === undefined ? row.project : `${row.project}, ${row.task}`;
    const where = m.cell(name, formatDay(day, locale));
    const what = draft.error === 'too-long' ? m.tooLong : m.invalid(draft.text);
    return [{ key, text: m.cellError(where, what) }];
  });
  const errorList = (
    <div role="alert" className="empty:hidden">
      {errors.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-negative-strong">
          {errors.map((error) => (
            <li key={error.key} className="flex items-start gap-1.5">
              <WarningIcon aria-hidden weight="bold" className="mt-0.5 size-3.5 shrink-0" />
              <span>{error.text}</span>
            </li>
          ))}
          <li className="ps-5 text-fg-muted">{m.entryHint}</li>
        </ul>
      )}
    </div>
  );
  const noteHint = (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted">
      <NotePencilIcon aria-hidden weight="fill" className="size-3.5 text-accent-strong" />
      <span>
        {isEditable(status, locked) && onNoteChange !== undefined ? m.noteHint : m.noteHintRead}
      </span>
    </p>
  );

  const submit = () => {
    const missing = totals.missing.map((day) => formatDay(day, locale)).join(', ');
    setConfirm({
      title: m.submitTitle,
      description:
        totals.missing.length > 0
          ? m.submitMissing(totals.missing.length, missing)
          : m.submitNote(hours(totals.week)),
      confirm: m.submitConfirm,
      cancel: m.cancel,
      tone: totals.missing.length > 0 ? 'warning' : 'neutral',
      onConfirm: () => onSubmit?.(),
    });
  };

  const actions: ReactNode[] = [];
  if (!locked && isEditable(status) && onSubmit !== undefined && rows.length > 0) {
    actions.push(
      <Button key="submit" size="sm" onClick={submit}>
        <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-3.5" />
        {m.submit}
      </Button>,
    );
  }
  if (!locked && status === 'submitted') {
    if (onRecall !== undefined) {
      actions.push(
        <Button key="recall" size="sm" variant="secondary" onClick={onRecall}>
          <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
          {m.recall}
        </Button>,
      );
    }
    if (onReject !== undefined) {
      actions.push(
        <Button
          key="reject"
          size="sm"
          variant="secondary"
          onClick={() => {
            setConfirm({
              title: m.rejectTitle,
              description: m.rejectNote,
              confirm: m.rejectConfirm,
              cancel: m.cancel,
              tone: 'warning',
              reason: { label: m.reasonLabel, required: true, missing: m.reasonMissing },
              onConfirm: (reason) => {
                onReject(reason);
              },
            });
          }}
        >
          {m.reject}
        </Button>,
      );
    }
    if (onApprove !== undefined) {
      actions.push(
        <Button key="approve" size="sm" onClick={onApprove}>
          <CheckIcon aria-hidden weight="bold" className="size-3.5" />
          {m.approve}
        </Button>,
      );
    }
  }

  const reviewLine =
    review === undefined
      ? null
      : status === 'approved' && review.on !== undefined
        ? m.approvedBy(review.by, formatDay(review.on, locale))
        : status === 'submitted' && review.on !== undefined
          ? m.submittedBy(review.by, formatDay(review.on, locale))
          : null;

  return (
    <BlockPanel
      title={title ?? m.title}
      description={m.week(range)}
      headingLevel={headingLevel ?? 2}
      className={className}
      bodyClassName="gap-4"
      actions={
        onWeekChange === undefined ? undefined : (
          <div className="flex items-center gap-1 pointer-coarse:gap-touch-gap">
            <Button
              size="sm"
              variant="secondary"
              iconOnly
              aria-label={m.previousWeek}
              onClick={() => {
                moveWeek(-1);
              }}
            >
              <CaretLeftIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              iconOnly
              aria-label={m.nextWeek}
              onClick={() => {
                moveWeek(1);
              }}
            >
              <CaretRightIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
            </Button>
          </div>
        )
      }
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {loading ? (
        <SkeletonTable rows={4} columns={5} />
      ) : (
        <>
          <div
            data-slot="timesheet-status"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <Badge tone={locked ? 'neutral' : STATUS_TONE[status]}>
                {locked ? (
                  <LockSimpleIcon aria-hidden weight="bold" />
                ) : (
                  <ClockIcon aria-hidden weight="bold" />
                )}
                {locked ? m.locked : m.status[status]}
              </Badge>
              <span className="text-sm font-medium numeric">
                {m.summary(hours(totals.week), hours(totals.expectedWeek))}
              </span>
              {totals.overtime > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-warning-strong numeric">
                  <WarningIcon aria-hidden weight="bold" className="size-3.5" />
                  {m.overtime(hours(totals.overtime))}
                </span>
              )}
              {totals.missing.length > 0 && (
                <span className="text-sm text-negative-strong">
                  {m.missingDays(totals.missing.length)}
                </span>
              )}
              {reviewLine !== null && <span className="text-sm text-fg-muted">{reviewLine}</span>}
            </div>
            {actions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-touch-gap">
                {actions}
              </div>
            )}
          </div>

          {status === 'rejected' && review !== undefined && !locked && (
            <Alert tone="warning" title={m.rejectedBy(review.by)}>
              {review.reason}
            </Alert>
          )}
          {(locked || status === 'approved') && (
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <LockSimpleIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />
              {m.lockedNote}
            </p>
          )}

          {rows.length === 0 ? (
            <EmptyNote
              title={m.emptyTitle}
              icon={ClockIcon}
              action={
                onAddRow === undefined || !isEditable(status, locked) ? undefined : (
                  <Button size="sm" variant="secondary" onClick={onAddRow}>
                    <PlusIcon aria-hidden weight="bold" className="size-3.5" />
                    {m.addRow}
                  </Button>
                )
              }
            >
              {m.emptyNote}
            </EmptyNote>
          ) : (
            <>
              <WeekGrid
                rows={rows}
                days={totals.days}
                rowTotals={totals.rows}
                weekTotal={totals.week}
                today={today}
                locale={locale}
                range={range}
                hours={hours}
                messages={m}
                cellProps={cellProps}
                activeKey={active === null ? null : cellKey(active.rowId, active.day)}
                footer={
                  <div className="flex flex-col gap-3 pt-1">
                    {errorList}
                    {noteEditor ?? noteHint}
                  </div>
                }
              />
              <DayList
                rows={rows}
                days={totals.days}
                today={today}
                locale={locale}
                hours={hours}
                messages={m}
                cellProps={cellProps}
                activeDay={active?.day ?? null}
                noteEditor={
                  noteEditor === null ? null : (
                    <div className="flex flex-col gap-3">
                      {errorList}
                      {noteEditor}
                    </div>
                  )
                }
              />
              {noteEditor === null && <div className="@2xl:hidden">{noteHint}</div>}
              {onAddRow !== undefined && isEditable(status, locked) && (
                <div>
                  <Button size="sm" variant="ghost" onClick={onAddRow}>
                    <PlusIcon aria-hidden weight="bold" className="size-3.5" />
                    {m.addRow}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
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

interface CellProps {
  cellId: string;
  label: string;
  minutes: number;
  entry: TimeEntry;
  locale: string;
  draft: Draft | undefined;
  editable: boolean;
  hasNote: boolean;
  messages: TimesheetMessages;
  onFocus: () => void;
  onDraft: (text: string) => void;
  onRevert: () => void;
  onCommit: (text: string) => boolean;
  onClockChange: (minutes: number | null) => void;
}

/** Moves the focus to the same day in the row above or below, inside one layout. */
function moveFocus(event: KeyboardEvent<HTMLElement>, by: number) {
  const here = event.currentTarget.closest<HTMLElement>('[data-cell]');
  const scope = event.currentTarget.closest<HTMLElement>('[data-cells]');
  if (here === null || scope === null) return;
  const [row, col] = (here.dataset.cell ?? '').split(':').map(Number);
  if (row === undefined || col === undefined) return;
  const target = scope.querySelector<HTMLInputElement>(
    `[data-cell="${String(row + by)}:${String(col)}"] input`,
  );
  if (target === null) return;
  event.preventDefault();
  target.focus();
  target.select();
}

/** One cell's time: a text field for decimal hours or a TimeField for hours and minutes. */
function HoursCell({
  cellId,
  label,
  minutes,
  entry,
  locale,
  draft,
  editable,
  hasNote,
  messages: m,
  onFocus,
  onDraft,
  onRevert,
  onCommit,
  onClockChange,
}: CellProps) {
  const errorId = `${cellId}-error`;
  const noteId = `${cellId}-note`;
  const invalid = draft?.error != null;
  const described = [invalid ? errorId : null, hasNote ? noteId : null].filter(Boolean).join(' ');
  const note = hasNote && (
    <>
      <NotePencilIcon
        aria-hidden
        weight="fill"
        className={cn(
          'pointer-events-none absolute top-1/2 size-3 -translate-y-1/2 text-accent-strong',
          // Decimal values sit at the end, clock fields start with their icon: the mark takes the free side.
          entry === 'clock' && editable ? 'end-2' : 'start-1.5',
        )}
      />
      <span id={noteId} className="sr-only">
        {m.hasNote}
      </span>
    </>
  );
  const error = invalid && (
    <span id={errorId} className="sr-only">
      {draft.error === 'too-long' ? m.tooLong : m.invalid(draft.text)} {m.entryHint}
    </span>
  );
  if (entry === 'clock' && editable) {
    return (
      <span className="relative block" onFocus={onFocus}>
        <TimeField
          aria-label={label}
          hourCycle={24}
          value={minutes === 0 ? null : { hour: Math.floor(minutes / 60), minute: minutes % 60 }}
          onValueChange={(value) => {
            onClockChange(value === null ? null : value.hour * 60 + value.minute);
          }}
          className="w-full"
        />
        {note}
      </span>
    );
  }
  return (
    <span className="relative block">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={described === '' ? undefined : described}
        readOnly={!editable}
        value={draft?.text ?? formatDuration(minutes, locale, entry)}
        onFocus={(event) => {
          onFocus();
          event.currentTarget.select();
        }}
        onChange={(event) => {
          onDraft(event.currentTarget.value);
        }}
        onBlur={(event) => {
          if (draft?.error === null) onCommit(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && draft !== undefined) {
            event.preventDefault();
            onRevert();
          } else if (event.key === 'Enter') {
            event.preventDefault();
            if (!editable || draft === undefined || onCommit(event.currentTarget.value)) {
              moveFocus(event, event.shiftKey ? -1 : 1);
            }
          } else if (event.key === 'ArrowDown') {
            moveFocus(event, 1);
          } else if (event.key === 'ArrowUp') {
            moveFocus(event, -1);
          }
        }}
        className={cn(
          'h-(--rx-control-height-sm) w-full min-w-14 rounded-control border border-transparent bg-transparent px-2',
          'text-end text-sm text-fg numeric placeholder:text-fg-subtle',
          'pointer-coarse:h-(--rx-control-height-touch)',
          'transition-[border-color,background-color] duration-fast ease-standard',
          'outline-none focus-visible:border-accent focus-visible:bg-surface focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-focus',
          editable && 'border-line bg-surface hover:border-line-strong',
          !editable && 'cursor-default',
          invalid && 'border-negative bg-negative-subtle text-negative-strong',
        )}
      />
      {note}
      {error}
    </span>
  );
}

/** A day total with its flag in words, so none rests on colour. */
function DayTotal({
  day,
  hours,
  messages: m,
  className,
}: {
  day: TimesheetDay;
  hours: (minutes: number) => string;
  messages: TimesheetMessages;
  className?: string;
}) {
  const difference = Math.abs(day.total - day.expected);
  return (
    <span className={cn('inline-flex flex-col items-end gap-0.5', className)}>
      <span className={cn('font-medium numeric', day.total === 0 && 'font-normal text-fg-subtle')}>
        {hours(day.total)}
      </span>
      {day.flag !== null && (
        <span
          className={cn('inline-flex items-center gap-1 text-xs font-medium', FLAG_TONE[day.flag])}
        >
          {day.flag !== 'short' && <WarningIcon aria-hidden weight="bold" className="size-3" />}
          <span aria-hidden>{m.flag[day.flag]}</span>
          <span className="sr-only">{m.flagDetail(day.flag, hours(difference))}</span>
        </span>
      )}
    </span>
  );
}

/** The wide layout: projects down, days across, totals on the end and along the foot. */
function WeekGrid({
  rows,
  days,
  rowTotals,
  weekTotal,
  today,
  locale,
  range,
  hours,
  messages: m,
  cellProps,
  activeKey,
  footer,
}: {
  rows: readonly TimesheetRow[];
  days: readonly TimesheetDay[];
  rowTotals: Record<string, number>;
  weekTotal: number;
  today: IsoDay;
  locale: string;
  range: string;
  hours: (minutes: number) => string;
  messages: TimesheetMessages;
  cellProps: (row: TimesheetRow, day: TimesheetDay) => CellProps;
  activeKey: string | null;
  footer: ReactNode;
}) {
  const { Row, Rows } = useBlockParts();
  const off = (day: TimesheetDay) => day.off !== null && 'bg-surface-sunken';
  return (
    <div data-slot="timesheet-grid" className="hidden flex-col gap-4 @2xl:flex">
      <div data-cells className="overflow-x-auto">
        <Table className="min-w-xl">
          <TableCaption className="sr-only">{m.week(range)}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">{m.project}</TableHead>
              {days.map((day) => {
                const isToday = day.day === today;
                return (
                  <TableHead
                    key={day.day}
                    align="end"
                    className={cn('w-20', off(day))}
                    aria-label={formatDayLong(day.day, locale)}
                    {...(isToday ? { 'aria-current': 'date' as const } : {})}
                  >
                    <span className="flex flex-col items-end leading-tight" aria-hidden>
                      <span
                        className={cn('text-xs', isToday ? 'text-accent-strong' : 'text-fg-muted')}
                      >
                        {formatWeekday(day.day, locale)}
                      </span>
                      <span className={cn('numeric', isToday && 'font-strong text-accent-strong')}>
                        {formatDayNumber(day.day, locale)}
                      </span>
                      <span className="max-w-20 truncate text-xs font-normal text-fg-subtle">
                        {day.off === null ? ' ' : day.off === 'weekend' ? m.weekend : day.off}
                      </span>
                    </span>
                  </TableHead>
                );
              })}
              <TableHead align="end" className="w-24">
                {m.total}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Rows>
              {rows.map((row, rowIndex) => (
                <Row key={row.id}>
                  <TableCell>
                    <span className="block font-medium">{row.project}</span>
                    {row.task !== undefined && (
                      <span className="block text-sm text-fg-muted">{row.task}</span>
                    )}
                  </TableCell>
                  {days.map((day, col) => {
                    const props = cellProps(row, day);
                    return (
                      <TableCell
                        key={day.day}
                        data-cell={`${String(rowIndex)}:${String(col)}`}
                        data-active={activeKey === cellKey(row.id, day.day) || undefined}
                        className={cn('px-1 py-1.5', off(day))}
                      >
                        <HoursCell {...props} />
                      </TableCell>
                    );
                  })}
                  <TableCell align="end" className="font-medium numeric">
                    {hours(rowTotals[row.id] ?? 0)}
                  </TableCell>
                </Row>
              ))}
            </Rows>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead scope="row">{m.dayTotal}</TableHead>
              {days.map((day) => (
                <TableCell key={day.day} align="end" className={cn('align-top', off(day))}>
                  <DayTotal day={day} hours={hours} messages={m} />
                </TableCell>
              ))}
              <TableCell align="end" className="align-top font-strong numeric">
                {hours(weekTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {footer}
    </div>
  );
}

/** The narrow layout: each day as a heading with its total, the projects listed under it. */
function DayList({
  rows,
  days,
  today,
  locale,
  hours,
  messages: m,
  cellProps,
  activeDay,
  noteEditor,
}: {
  rows: readonly TimesheetRow[];
  days: readonly TimesheetDay[];
  today: IsoDay;
  locale: string;
  hours: (minutes: number) => string;
  messages: TimesheetMessages;
  cellProps: (row: TimesheetRow, day: TimesheetDay) => CellProps;
  activeDay: IsoDay | null;
  noteEditor: ReactNode;
}) {
  const id = useId();
  // A week is long on a phone: today (or the first day) starts open, the rest show their totals
  // and open on demand. A day with the cell in focus stays open.
  const [open, setOpen] = useState<ReadonlySet<IsoDay>>(
    () => new Set([days.some((d) => d.day === today) ? today : (days[0]?.day ?? today)]),
  );
  return (
    <ol data-slot="timesheet-list" data-cells className="flex flex-col gap-2 @2xl:hidden">
      {days.map((day, col) => {
        const headingId = `${id}-${day.day}`;
        const bodyId = `${id}-${day.day}-body`;
        const expanded = open.has(day.day) || activeDay === day.day;
        return (
          <li
            key={day.day}
            aria-labelledby={headingId}
            className={cn(
              'flex flex-col rounded-panel border border-line',
              day.off !== null && 'bg-surface-sunken',
            )}
          >
            <h3 id={headingId} className="text-sm font-medium">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={bodyId}
                onClick={() => {
                  setOpen((current) => {
                    const next = new Set(current);
                    if (expanded) next.delete(day.day);
                    else next.add(day.day);
                    return next;
                  });
                }}
                className={cn(
                  'flex min-h-(--rx-control-height-touch) w-full cursor-pointer items-center gap-3 rounded-panel px-3 py-2 text-start',
                  'hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
                )}
              >
                <CaretRightIcon
                  aria-hidden
                  weight="bold"
                  className={cn(
                    'size-3.5 shrink-0 text-fg-muted transition-transform duration-fast ease-standard',
                    expanded && 'rotate-90',
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>
                    {formatDay(day.day, locale)}
                    {day.day === today && (
                      <span className="ms-2 text-xs font-medium text-accent-strong">{m.today}</span>
                    )}
                  </span>
                  {day.off !== null && (
                    <span className="text-xs font-normal text-fg-muted">
                      {day.off === 'weekend' ? m.weekend : day.off}
                    </span>
                  )}
                </span>
                <DayTotal day={day} hours={hours} messages={m} className="text-sm" />
              </button>
            </h3>
            {expanded && (
              <div id={bodyId}>
                <ul className="flex flex-col divide-y divide-line border-t border-line">
                  {rows.map((row, rowIndex) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 px-3 py-1.5"
                    >
                      <span className="min-w-0 text-sm">
                        <span className="block truncate">{row.project}</span>
                        {row.task !== undefined && (
                          <span className="block truncate text-xs text-fg-muted">{row.task}</span>
                        )}
                      </span>
                      <span
                        data-cell={`${String(rowIndex)}:${String(col)}`}
                        className="w-24 shrink-0"
                      >
                        <HoursCell {...cellProps(row, day)} />
                      </span>
                    </li>
                  ))}
                </ul>
                {activeDay === day.day && noteEditor !== null && (
                  <div className="border-t border-line px-3 py-3">{noteEditor}</div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The note of the cell in focus: a field that saves when it loses the focus, or the text alone. */
function NoteEditor({
  label,
  note,
  editable,
  messages: m,
  onSave,
}: {
  label: string;
  note: string;
  editable: boolean;
  messages: TimesheetMessages;
  onSave: (note: string) => void;
}) {
  const [text, setText] = useState(note);
  const saved = useRef(note);
  const id = useId();
  if (!editable) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        <p className={cn('text-sm', note === '' ? 'text-fg-subtle' : 'text-fg-muted')}>
          {note === '' ? m.noNote : note}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        value={text}
        onValueChange={setText}
        minRows={2}
        maxRows={5}
        placeholder={m.notePlaceholder}
        onBlur={() => {
          if (text.trim() === saved.current.trim()) return;
          saved.current = text.trim();
          onSave(text.trim());
        }}
      />
    </div>
  );
}
