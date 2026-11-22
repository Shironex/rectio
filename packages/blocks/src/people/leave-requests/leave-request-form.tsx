'use client';

import { PaperPlaneTiltIcon, UsersThreeIcon } from '@phosphor-icons/react';
import {
  Alert,
  Checkbox,
  Field,
  FieldLabel,
  RangeCalendar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
  localDate,
} from '@rectio/ui';
import { useId, useState } from 'react';

import { BlockPanel } from '../../lib/block-panel';
import { useBlockParts } from '../../lib/block-parts';
import { resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { addDays, toIsoDay, type IsoDay } from '../lib/days';
import { formatDayRange, formatDays } from '../lib/format';
import { LEAVE_REQUESTS_MESSAGES, type LeaveRequestsMessages } from './leave-requests-messages';
import {
  leaveBalances,
  leaveHalves,
  leaveOverlaps,
  leaveProblem,
  overlapPeople,
  spanFromPicked,
  type LeaveRequest,
  type LeaveSpan,
  type LeaveType,
} from './leave-requests.logic';

/** What the form sends: the span with an exclusive end, its type, note and size in half days. */
export interface LeaveDraft extends LeaveSpan {
  type: string;
  note: string;
  halves: number;
}

export interface LeaveRequestFormProps {
  types: readonly LeaveType[];
  /** The person asking. Their requests in `requests` make up the balances. */
  personId: string;
  /** Leave already asked for, the person's own (for the balance) and the team's (for overlaps). */
  requests?: readonly LeaveRequest[] | undefined;
  onSubmit: (draft: LeaveDraft) => void;
  onCancel?: (() => void) | undefined;
  defaultType?: string | undefined;
  /** The first day that can be picked, such as today. Earlier days are greyed out. */
  minDay?: IsoDay | undefined;
  weekend?: readonly number[] | undefined;
  holidays?: Readonly<Record<IsoDay, string>> | undefined;
  /** Months side by side; they stack on a narrow screen. 2 by default. */
  numberOfMonths?: number | undefined;
  /** The month shown first. The month of `minDay`, else this month. */
  defaultMonth?: IsoDay | undefined;
  locale?: string | undefined;
  title?: string | undefined;
  headingLevel?: 2 | 3 | undefined;
  messages?: Partial<LeaveRequestsMessages> | undefined;
  className?: string | undefined;
}

/**
 * Asks for leave: a type with its balance, a range picked on the calendar, half a first or last
 * day, and a note. Under the calendar it counts the working days the range takes, the balance left
 * after it and the teammates already off then, and holds the request back while it is more than
 * the balance or covers no working day.
 */
export function LeaveRequestForm({
  types,
  personId,
  requests = [],
  onSubmit,
  onCancel,
  defaultType,
  minDay,
  weekend,
  holidays,
  numberOfMonths = 2,
  defaultMonth,
  locale: requestedLocale,
  title,
  headingLevel,
  messages,
  className,
}: LeaveRequestFormProps) {
  const m = mergeMessages(LEAVE_REQUESTS_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const calendar = { weekend, holidays };
  const [type, setType] = useState(defaultType ?? types[0]?.id ?? '');
  const [picked, setPicked] = useState<
    { from?: Date | undefined; to?: Date | undefined } | undefined
  >();
  const [halfStart, setHalfStart] = useState(false);
  const [halfEnd, setHalfEnd] = useState(false);
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const noteId = useId();
  const problemId = useId();

  const balances = leaveBalances(types, requests, personId, calendar);
  const balance = balances.find((b) => b.type.id === type);
  const daysText = (halves: number) => m.days(formatDays(halves, locale), halves);
  const base =
    picked?.from === undefined
      ? null
      : spanFromPicked(toIsoDay(picked.from), toIsoDay(picked.to ?? picked.from));
  const single = base !== null && addDays(base.start, 1) === base.end;
  const span: LeaveSpan | null =
    base === null ? null : { ...base, halfStart, halfEnd: single ? false : halfEnd };
  const halves = span === null ? 0 : leaveHalves(span, calendar);
  const problem = leaveProblem(picked?.to === undefined ? null : span, balance, calendar);
  const overlaps = span === null ? [] : leaveOverlaps(span, requests, { personId, calendar });
  const people = overlapPeople(overlaps);
  const overlapDays = new Set(overlaps.flatMap((o) => o.days)).size;
  const showProblem = problem !== null && (tried || problem !== 'no-range');

  return (
    <BlockPanel
      title={title ?? m.formTitle}
      headingLevel={headingLevel ?? 2}
      className={className}
      bodyClassName="gap-5"
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (problem !== null || span === null) {
            setTried(true);
            return;
          }
          onSubmit({ ...span, type, note: note.trim(), halves });
        }}
      >
        <Field className="max-w-sm">
          <FieldLabel>{m.typeLabel}</FieldLabel>
          <Select
            items={types.map((t) => ({ value: t.id, label: t.label }))}
            value={type}
            onValueChange={(next) => {
              if (typeof next === 'string') setType(next);
            }}
          >
            <SelectTrigger />
            <SelectContent>
              {types.map((t) => {
                const left = balances.find((b) => b.type.id === t.id)?.left ?? null;
                return (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex w-full items-baseline justify-between gap-4">
                      <span>{t.label}</span>
                      <span className="text-sm text-fg-muted numeric">
                        {left === null ? m.unlimited : m.typeLeft(daysText(left))}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-1.5 text-sm font-medium">{m.datesLabel}</legend>
          <div className="w-fit max-w-full overflow-x-auto rounded-panel border border-line">
            <RangeCalendar
              aria-label={m.datesLabel}
              value={picked === undefined ? undefined : { from: picked.from, to: picked.to }}
              onValueChange={(next) => {
                setPicked(next);
                if (next?.to === undefined) {
                  setHalfStart(false);
                  setHalfEnd(false);
                }
              }}
              locale={locale}
              numberOfMonths={numberOfMonths}
              hideSummary
              {...(minDay === undefined ? {} : { disabledDays: { before: localDate(minDay) } })}
              {...((defaultMonth ?? minDay)
                ? { defaultMonth: localDate(defaultMonth ?? minDay ?? '') }
                : {})}
            />
          </div>
          {span !== null && picked?.to !== undefined && (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {single ? (
                <HalfDay checked={halfStart} onChange={setHalfStart} label={m.halfDayLabel} />
              ) : (
                <>
                  <HalfDay checked={halfStart} onChange={setHalfStart} label={m.halfStartLabel} />
                  <HalfDay checked={halfEnd} onChange={setHalfEnd} label={m.halfEndLabel} />
                </>
              )}
            </div>
          )}
        </fieldset>

        <div
          data-slot="leave-preview"
          aria-live="polite"
          className="flex flex-col gap-1 rounded-panel bg-surface-sunken px-4 py-3"
        >
          {span === null || picked?.to === undefined ? (
            <p className="text-sm text-fg-muted">{m.problem['no-range']}</p>
          ) : (
            <>
              <p className="text-sm font-medium numeric">
                {m.preview(daysText(halves), formatDayRange(span.start, span.end, locale, m.range))}
              </p>
              <p className="text-sm text-fg-muted numeric">
                {balance?.left == null
                  ? m.noBalanceLimit
                  : m.balanceAfter(daysText(balance.left), daysText(balance.left - halves))}
              </p>
            </>
          )}
        </div>

        {people.length > 0 && (
          <Alert
            tone="warning"
            title={m.overlapTitle}
            icon={<UsersThreeIcon aria-hidden weight="bold" />}
          >
            {m.overlapLong(people.map((p) => p.name).join(', '), people.length, overlapDays)}
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor={noteId}>{m.noteLabel}</FieldLabel>
          <Textarea
            id={noteId}
            value={note}
            onValueChange={setNote}
            minRows={2}
            maxRows={5}
            placeholder={m.notePlaceholder}
          />
        </Field>

        {showProblem && (
          <p id={problemId} role="alert" className="text-sm font-medium text-negative-strong">
            {m.problem[problem]}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 pointer-coarse:gap-touch-gap">
          {onCancel !== undefined && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {m.cancel}
            </Button>
          )}
          <Button type="submit" aria-describedby={showProblem ? problemId : undefined}>
            <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
            {m.submit}
          </Button>
        </div>
      </form>
    </BlockPanel>
  );
}

function HalfDay({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-(--rx-control-height-sm) cursor-pointer items-center gap-2.5 text-sm pointer-coarse:min-h-(--rx-control-height-touch)">
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => {
          onChange(next);
        }}
      />
      {label}
    </label>
  );
}
