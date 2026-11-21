'use client';

import type { DateRange, DayPickerLocale } from '@daypicker/react';
import { format, isAfter, isSameDay } from 'date-fns';
import { useState, type ComponentProps } from 'react';

import { Calendar } from '../calendar/calendar';
import { resolveDateLocale } from '../calendar/locales';
import { cn } from '../lib/cn';
import { formatDateRange, rangeLength } from './range-format';

export interface DateRangePreset {
  label: string;
  range: { from: Date; to: Date };
}

const sameRange = (a: DateRange | undefined, b: DateRangePreset['range']) =>
  a?.from !== undefined && a.to !== undefined && isSameDay(a.from, b.from) && isSameDay(a.to, b.to);

/**
 * Common periods as a column of buttons, each with its dates written out. The one matching the
 * current range shows as pressed. Shared by RangeCalendar and DateRangePicker.
 */
export function RangePresets({
  presets,
  value,
  dateLocale,
  onPick,
  className,
}: {
  presets: readonly DateRangePreset[];
  value: DateRange | undefined;
  dateLocale: DayPickerLocale;
  onPick: (range: DateRangePreset['range']) => void;
  className?: string;
}) {
  return (
    <ul
      aria-label="Common periods"
      data-slot="range-presets"
      className={cn(
        'flex flex-wrap gap-1 border-b border-line p-2 sm:w-40 sm:flex-col sm:flex-nowrap sm:border-e sm:border-b-0',
        className,
      )}
    >
      {presets.map((preset) => (
        <li key={preset.label}>
          <button
            type="button"
            aria-pressed={sameRange(value, preset.range)}
            onClick={() => {
              onPick({ ...preset.range });
            }}
            className={cn(
              'flex min-h-(--rx-button-height-sm) pointer-coarse:min-h-(--rx-button-height-touch) w-full cursor-pointer items-center rounded-(--rx-button-radius) px-(--rx-button-padding-x-sm) py-1',
              'text-start text-sm whitespace-nowrap text-fg-muted hover:bg-surface-hover hover:text-fg',
              'aria-pressed:bg-surface-selected aria-pressed:font-medium aria-pressed:text-fg',
              'transition-colors duration-fast ease-standard',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            )}
          >
            <span className="flex flex-col">
              <span>
                {preset.label}
                <span className="sr-only">, </span>
              </span>
              {/* The dates themselves, so a preset never surprises. */}
              <span className="text-xs font-regular text-fg-subtle numeric">
                {formatDateRange(preset.range, dateLocale)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export interface RangeCalendarProps {
  value: DateRange | undefined;
  /** Called on every press: with the start alone after the first, with both ends after the second. */
  onValueChange: (value: DateRange | undefined) => void;
  /** Called once a range is whole, by a second press or a preset. */
  onComplete?: (value: { from: Date; to: Date }) => void;
  locale?: string;
  dateLocale?: DayPickerLocale;
  /** Months side by side. Two by default; they stack on narrow screens. */
  numberOfMonths?: number;
  /** Common periods beside the calendar. One press picks the whole range. */
  presets?: readonly DateRangePreset[];
  disabledDays?: ComponentProps<typeof Calendar>['disabled'];
  /** The month shown first. Defaults to the start of the range, else this month. */
  defaultMonth?: Date;
  /** Hides the line under the calendar that reads out the range and its length. */
  hideSummary?: boolean;
  className?: string;
  /** Names the calendar, such as "Stay". */
  'aria-label'?: string;
}

/**
 * A period picked in place, without a popup: two months side by side, presets beside them and a
 * line under them that says what is picked. Every press after a whole range starts a fresh one: the
 * first press is the start, the second the end, and while the end is open the days up to the
 * pointer show the range it would make.
 */
export function RangeCalendar({
  value,
  onValueChange,
  onComplete,
  locale,
  dateLocale: dateLocaleProp,
  numberOfMonths = 2,
  presets,
  disabledDays,
  defaultMonth,
  hideSummary = false,
  className,
  'aria-label': ariaLabel,
}: RangeCalendarProps) {
  const dateLocale = dateLocaleProp ?? resolveDateLocale(locale);
  const [pickingEnd, setPickingEnd] = useState(false);
  const [hovered, setHovered] = useState<Date | null>(null);
  const from = value?.from;
  const to = value?.to;
  const firstMonth = defaultMonth ?? from;
  const preview =
    pickingEnd && from !== undefined && hovered !== null && isAfter(hovered, from)
      ? { from, to: hovered }
      : undefined;

  const complete = (range: { from: Date; to: Date }) => {
    setPickingEnd(false);
    setHovered(null);
    onValueChange(range);
    onComplete?.(range);
  };

  const summary =
    from === undefined
      ? 'Pick the first day'
      : to === undefined
        ? `From ${format(from, 'd MMM yyyy', { locale: dateLocale })}. Pick the last day`
        : `${formatDateRange({ from, to }, dateLocale)}, ${String(rangeLength({ from, to }))} ${rangeLength({ from, to }) === 1 ? 'day' : 'days'}`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="range-calendar"
      className={cn('flex w-fit flex-col sm:flex-row', className)}
    >
      {presets !== undefined && presets.length > 0 && (
        <RangePresets presets={presets} value={value} dateLocale={dateLocale} onPick={complete} />
      )}
      <div className="flex flex-col">
        <Calendar
          mode="range"
          required={false}
          dateLocale={dateLocale}
          numberOfMonths={numberOfMonths}
          // Side by side months would repeat the days where they meet.
          showOutsideDays={numberOfMonths === 1}
          selected={value}
          {...(firstMonth === undefined ? {} : { defaultMonth: firstMonth })}
          disabled={disabledDays}
          modifiers={preview === undefined ? {} : { preview }}
          modifiersClassNames={{
            preview: 'not-data-selected:bg-surface-hover',
          }}
          onDayMouseEnter={(day) => {
            if (pickingEnd) setHovered(day);
          }}
          onDayMouseLeave={() => {
            setHovered(null);
          }}
          onSelect={(range, picked) => {
            // The first press is always a fresh start, the second the end.
            if (!pickingEnd || from === undefined) {
              setPickingEnd(true);
              onValueChange({ from: picked, to: undefined });
              return;
            }
            const whole =
              range?.from !== undefined && range.to !== undefined
                ? { from: range.from, to: range.to }
                : { from: picked, to: picked };
            complete(whole);
          }}
        />
        {!hideSummary && (
          <p
            role="status"
            aria-live="polite"
            data-slot="range-calendar-summary"
            className="border-t border-line px-4 py-2.5 text-sm text-fg-muted numeric"
          >
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
