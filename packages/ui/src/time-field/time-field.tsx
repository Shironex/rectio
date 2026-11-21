'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { ClockIcon } from '@phosphor-icons/react';
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { controlSurface } from '../field/control-styles';
import { cn } from '../lib/cn';
import {
  clampTime,
  dayPeriodNames,
  formatIsoTime,
  formatTime,
  fromTwelveHour,
  isTimeInRange,
  resolveHourCycle,
  stepTime,
  toTwelveHour,
  typeDigit,
  type HourCycle,
  type TimeSegment,
  type TimeValue,
} from './time';

export interface TimeFieldProps {
  value: TimeValue | null;
  /** Called with the time once both hour and minute are set, null when either is cleared. */
  onValueChange: (value: TimeValue | null) => void;
  /** BCP 47 tag: the clock (12 or 24 hours) and the day period names follow it. */
  locale?: string;
  /** Forces a 12 or 24 hour face, whatever the locale reads. */
  hourCycle?: HourCycle;
  /** Minutes between the marks the arrow keys step the minute to, such as 15. Default 1. */
  step?: number;
  /** The earliest time allowed. Arrow keys stop here; a typed time before it is marked invalid. */
  min?: TimeValue;
  /** The latest time allowed. Arrow keys stop here; a typed time after it is marked invalid. */
  max?: TimeValue;
  disabled?: boolean;
  /** Submits the time as `HH:mm` in a hidden input of this name. */
  name?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  className?: string;
  /** Names of the segments after the first, which the FieldLabel names. */
  minuteLabel?: string;
  periodLabel?: string;
  /** Only when no FieldLabel names the field. */
  'aria-label'?: string;
}

/** What the segments hold while a time is half typed: either part can still be empty. */
interface Draft {
  hour: number | null;
  minute: number | null;
  pm: boolean;
}

const draftOf = (value: TimeValue | null, pm = false): Draft =>
  value === null
    ? { hour: null, minute: null, pm }
    : { hour: value.hour, minute: value.minute, pm: value.hour >= 12 };

const segmentClass = cn(
  'h-full min-w-5 pointer-coarse:min-w-11 field-sizing-content rounded-badge bg-transparent px-0.5 text-center caret-transparent outline-none',
  'focus:bg-surface-selected focus:text-fg',
  'placeholder:text-fg-subtle data-disabled:cursor-not-allowed disabled:cursor-not-allowed',
);

/** How far Page Up and Page Down move each segment. */
const LARGE_DELTA = { hour: 3, minute: 15, period: 1 } as const;

/**
 * A time of day, typed segment by segment: hours, minutes and, on a 12 hour face, the day period.
 * The clock follows the locale (12 hours for en-US, 24 for en-GB and pl-PL) unless `hourCycle`
 * says otherwise. Arrow keys step a segment (minutes by `step`), Page Up and Down step further,
 * Home and End jump to its ends, A and P set the period, and typing moves on by itself once a
 * segment is complete. Wrap it in a Field for the label, description and error, like any input.
 */
export function TimeField({
  value,
  onValueChange,
  locale,
  hourCycle: hourCycleProp,
  step = 1,
  min,
  max,
  disabled = false,
  name,
  autoFocus,
  onBlur,
  className,
  minuteLabel = 'Minutes',
  periodLabel = 'AM or PM',
  'aria-label': ariaLabel,
}: TimeFieldProps) {
  const hourCycle = hourCycleProp ?? resolveHourCycle(locale);
  const twelve = hourCycle === 12;
  const [am, pm] = dayPeriodNames(locale);
  const [draft, setDraft] = useState<Draft>(() => draftOf(value));
  const [shown, setShown] = useState(value);
  const buffer = useRef('');
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const periodRef = useRef<HTMLInputElement>(null);

  // Keep the segments in step when the value changes from outside (picked, reset, loaded).
  if (value?.hour !== shown?.hour || value?.minute !== shown?.minute) {
    setShown(value);
    setDraft(draftOf(value, draft.pm));
  }

  const complete = draft.hour !== null && draft.minute !== null;
  const current: TimeValue | null = complete
    ? { hour: draft.hour ?? 0, minute: draft.minute ?? 0 }
    : null;
  const outOfRange = current !== null && !isTimeInRange(current, min, max);

  const commit = (next: Draft) => {
    setDraft(next);
    const time =
      next.hour !== null && next.minute !== null ? { hour: next.hour, minute: next.minute } : null;
    if (time?.hour !== value?.hour || time?.minute !== value?.minute) {
      setShown(time);
      onValueChange(time);
    }
  };

  const order: TimeSegment[] = twelve ? ['hour', 'minute', 'period'] : ['hour', 'minute'];
  const refs = { hour: hourRef, minute: minuteRef, period: periodRef };
  const focusSegment = (segment: TimeSegment | undefined) => {
    if (segment === undefined) return;
    buffer.current = '';
    refs[segment].current?.focus();
  };
  const move = (segment: TimeSegment, by: number) => {
    focusSegment(order[order.indexOf(segment) + by]);
  };

  /** A step on a segment that is still empty fills it with the start of its range. */
  const stepDraft = (segment: TimeSegment, delta: number) => {
    if (segment === 'period') {
      const nextPm = !draft.pm;
      commit({
        ...draft,
        pm: nextPm,
        hour: draft.hour === null ? null : fromTwelveHour(draft.hour, nextPm),
      });
      return;
    }
    if (draft[segment] === null) {
      const start =
        segment === 'hour'
          ? delta > 0
            ? (min?.hour ?? (twelve ? fromTwelveHour(12, draft.pm) : 0))
            : (max?.hour ?? (twelve ? fromTwelveHour(11, draft.pm) : 23))
          : delta > 0
            ? 0
            : 60 - step;
      commit({ ...draft, [segment]: start });
      return;
    }
    const base = { hour: draft.hour ?? 0, minute: draft.minute ?? 0 };
    let next = stepTime(base, segment, delta, { step, hourCycle });
    // Stepping never leaves the allowed range: it stops at the bound instead of wrapping past it.
    if (complete && (min !== undefined || max !== undefined)) next = clampTime(next, min, max);
    commit({ ...draft, hour: next.hour, minute: next.minute, pm: next.hour >= 12 });
  };

  const onKeyDown = (segment: TimeSegment) => (event: KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;
    const deltas: Record<string, number> = {
      ArrowUp: 1,
      ArrowDown: -1,
      PageUp: LARGE_DELTA[segment],
      PageDown: -LARGE_DELTA[segment],
    };
    const delta = deltas[key];
    if (delta !== undefined) {
      event.preventDefault();
      buffer.current = '';
      stepDraft(segment, delta);
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      // Segments read in the document's direction, so the arrow keys follow it.
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
      move(segment, (key === 'ArrowRight') !== rtl ? 1 : -1);
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      buffer.current = '';
      const first = key === 'Home';
      if (segment === 'hour') {
        const hour = twelve ? fromTwelveHour(first ? 12 : 11, draft.pm) : first ? 0 : 23;
        commit({ ...draft, hour });
      } else if (segment === 'minute') {
        commit({ ...draft, minute: first ? 0 : 60 - step });
      }
    } else if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      buffer.current = '';
      if (segment === 'period') return;
      // Clearing an empty segment steps back, the way deleting text does.
      if (draft[segment] === null && key === 'Backspace') move(segment, -1);
      else commit({ ...draft, [segment]: null });
    } else if (key === ':' || key === '.' || key === ' ') {
      event.preventDefault();
      move(segment, 1);
    } else if (segment === 'period' && /^[a-z]$/i.test(key)) {
      event.preventDefault();
      typePeriod(key);
    }
  };

  const typePeriod = (letter: string) => {
    const lower = letter.toLowerCase();
    const wantPm = lower === pm[0]?.toLowerCase() || lower === 'p';
    const wantAm = lower === am[0]?.toLowerCase() || lower === 'a';
    if (!wantPm && !wantAm) return;
    commit({
      ...draft,
      pm: wantPm,
      hour: draft.hour === null ? null : fromTwelveHour(draft.hour, wantPm),
    });
  };

  // Digits arrive through `change` too, so a phone keyboard that sends no key codes still types.
  const onChange = (segment: TimeSegment) => (event: ChangeEvent<HTMLInputElement>) => {
    const typed = event.target.value.slice(-1);
    if (segment === 'period') {
      typePeriod(typed);
      return;
    }
    if (!/^\d$/.test(typed)) return;
    const result = typeDigit(buffer.current, typed, segment, hourCycle);
    buffer.current = result.buffer;
    const number =
      segment === 'hour' && twelve ? fromTwelveHour(result.value, draft.pm) : result.value;
    commit({ ...draft, [segment]: number });
    if (result.advance) move(segment, 1);
  };

  const twelveHour = draft.hour === null ? null : toTwelveHour(draft.hour).hour;
  const hourText =
    draft.hour === null ? '' : String(twelve ? twelveHour : draft.hour).padStart(2, '0');
  const minuteText = draft.minute === null ? '' : String(draft.minute).padStart(2, '0');
  const periodText = draft.pm ? pm : am;
  const timeText = current === null ? undefined : formatTime(current, locale, hourCycle);

  const segment = (part: TimeSegment) => ({
    onKeyDown: onKeyDown(part),
    onChange: onChange(part),
    onFocus: (event: { currentTarget: HTMLInputElement }) => {
      buffer.current = '';
      event.currentTarget.select();
    },
    disabled,
    autoComplete: 'off',
    spellCheck: false,
    role: 'spinbutton',
    'aria-invalid': outOfRange || undefined,
    className: segmentClass,
  });

  return (
    <div
      role="group"
      data-slot="time-field"
      data-disabled={disabled || undefined}
      data-invalid={outOfRange || undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          buffer.current = '';
          onBlur?.();
        }
      }}
      className={cn(
        controlSurface,
        'flex w-fit items-center gap-0.5 ps-(--rx-field-padding-x) pe-(--rx-field-padding-x) numeric',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
        'has-data-invalid:border-negative has-data-invalid:ring-1 has-data-invalid:ring-negative has-data-invalid:ring-inset',
        className,
      )}
    >
      <ClockIcon aria-hidden weight="bold" className="me-1.5 size-4 shrink-0 text-fg-subtle" />
      <BaseField.Control
        ref={hourRef}
        {...segment('hour')}
        // Base UI's own value handling stays out of the way: the segment is driven here.
        value={hourText}
        onValueChange={() => undefined}
        autoFocus={autoFocus}
        placeholder="--"
        inputMode="numeric"
        size={2}
        aria-label={ariaLabel}
        aria-valuemin={twelve ? 1 : 0}
        aria-valuemax={twelve ? 12 : 23}
        aria-valuenow={draft.hour === null ? undefined : (twelveHour ?? draft.hour)}
        aria-valuetext={
          draft.hour === null
            ? 'Empty'
            : `${hourText} hours${timeText === undefined ? '' : `, ${timeText}`}`
        }
      />
      <span aria-hidden className="text-fg-subtle">
        :
      </span>
      <input
        ref={minuteRef}
        {...segment('minute')}
        value={minuteText}
        placeholder="--"
        inputMode="numeric"
        size={2}
        aria-label={minuteLabel}
        aria-valuemin={0}
        aria-valuemax={59}
        aria-valuenow={draft.minute ?? undefined}
        aria-valuetext={
          draft.minute === null
            ? 'Empty'
            : `${minuteText} minutes${timeText === undefined ? '' : `, ${timeText}`}`
        }
      />
      {twelve && (
        <input
          ref={periodRef}
          {...segment('period')}
          value={periodText}
          inputMode="text"
          size={Math.max(am.length, pm.length)}
          aria-label={periodLabel}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={draft.pm ? 1 : 0}
          aria-valuetext={periodText}
          className={cn(segmentClass, 'ms-1')}
        />
      )}
      {name !== undefined && (
        <input
          type="hidden"
          name={name}
          value={current === null ? '' : formatIsoTime(current)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
