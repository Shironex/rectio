'use client';

import { DayPicker, type DayPickerLocale, type DayPickerProps } from '@daypicker/react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

import { cn } from '../lib/cn';
import { resolveDateLocale } from './locales';

/** Omit that keeps DayPicker's mode union intact (single, multiple, range). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type CalendarProps = DistributiveOmit<DayPickerProps, 'locale'> & {
  /** BCP 47 tag such as `en-GB` or `pl-PL`: names, first weekday and labels follow it. */
  locale?: string;
  /** Any DayPicker locale, for tags the calendar does not know by name. Wins over `locale`. */
  dateLocale?: DayPickerLocale;
};

/** Day size from tokens; touch screens get the larger size so every day is a full target. */
const day = 'size-(--rx-calendar-day-size) pointer-coarse:size-(--rx-calendar-day-size-touch)';

/**
 * State lives on the day cell (`selected`, `today`, `range_start`...) and paints its button. The
 * range middle overrides the selected fill with `!`, because DayPicker marks it selected as well.
 */
const CLASS_NAMES: DayPickerProps['classNames'] = {
  root: 'relative w-fit p-3',
  months: 'relative flex flex-col gap-6 sm:flex-row',
  month: 'flex flex-col gap-2',
  month_caption: cn(
    'flex h-(--rx-calendar-day-size) items-center ps-2 pointer-coarse:h-(--rx-calendar-day-size-touch)',
  ),
  caption_label: 'text-base font-medium text-fg',
  // The nav sits inside the months box, on the first caption's line.
  nav: 'absolute end-0 top-0 z-10 flex items-center gap-1',
  button_previous: cn(
    day,
    'inline-flex cursor-pointer items-center justify-center rounded-(--rx-calendar-radius) text-fg-muted',
    'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
    'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
    'aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent',
  ),
  button_next: cn(
    day,
    'inline-flex cursor-pointer items-center justify-center rounded-(--rx-calendar-radius) text-fg-muted',
    'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
    'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
    'aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent',
  ),
  month_grid: 'border-collapse',
  weekdays: '',
  weekday: cn(day, 'p-0 text-xs font-medium text-fg-subtle'),
  week: '',
  day: cn(day, 'p-0 text-center'),
  day_button: cn(
    day,
    'inline-flex cursor-pointer items-center justify-center rounded-(--rx-calendar-radius)',
    'text-base text-fg numeric',
    'transition-colors duration-fast ease-standard hover:bg-surface-hover',
    'outline-offset-2 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-focus',
  ),
  // Today: a hairline box drawn inside the day and a stronger weight, never colour alone. Muted text
  // colour on a plain day, so it holds its contrast in dark themes; the contrast colour inside a
  // selected fill, so a selected today still reads as today. An outline, not a shadow, so forced
  // colours keep it. It steps aside while the day has keyboard focus: the focus outline is thicker
  // and sits outside the day.
  today: cn(
    '[&>button]:font-strong',
    '[&>button:not(:focus-visible)]:outline-1 [&>button:not(:focus-visible)]:-outline-offset-1',
    'not-data-selected:[&>button:not(:focus-visible)]:outline-fg-muted',
    'data-selected:[&>button:not(:focus-visible)]:-outline-offset-3',
    'data-selected:[&>button:not(:focus-visible)]:outline-accent-contrast',
  ),
  selected: cn(
    '[&>button]:bg-accent [&>button]:font-medium [&>button]:text-accent-contrast',
    '[&>button]:hover:bg-accent-hover',
  ),
  // The band between the ends uses the same quiet tint as a selected table row.
  range_start: 'rounded-s-(--rx-calendar-radius) bg-surface-selected',
  range_end: 'rounded-e-(--rx-calendar-radius) bg-surface-selected',
  range_middle: cn(
    'bg-surface-selected',
    '[&>button]:rounded-none! [&>button]:bg-transparent! [&>button]:font-regular! [&>button]:text-fg!',
    '[&>button]:hover:bg-surface-hover!',
  ),
  // Days of the months around are muted, never struck: they are not closed, only elsewhere.
  outside: 'not-data-selected:not-data-disabled:[&>button]:text-fg-subtle',
  // A closed day is dimmed and struck, wherever it falls, so it never relies on colour alone. The
  // strike is reserved for it; explain why days are closed beside the calendar.
  disabled: cn(
    '[&>button]:cursor-not-allowed [&>button]:text-fg-disabled [&>button]:line-through',
    '[&>button]:hover:bg-transparent',
  ),
  hidden: 'invisible',
};

function Chevron({ orientation }: { orientation?: 'up' | 'down' | 'left' | 'right' }) {
  const Icon = orientation === 'left' ? CaretLeftIcon : CaretRightIcon;
  return <Icon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />;
}

/**
 * A month grid on DayPicker (@daypicker/react), styled only with tokens. Single dates, several
 * dates or a range (`mode`). Arrow keys move by day, Page Up and Down by month, Home and End to the week's
 * ends; the first day of the week follows the locale.
 */
export function Calendar({
  locale,
  dateLocale,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      data-slot="calendar"
      locale={dateLocale ?? resolveDateLocale(locale)}
      showOutsideDays={showOutsideDays}
      classNames={{ ...CLASS_NAMES, ...classNames }}
      components={{ Chevron }}
      {...props}
    />
  );
}
