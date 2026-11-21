'use client';

import type { DateRange, DayPickerLocale } from '@daypicker/react';
import { Field as BaseField } from '@base-ui/react/field';
import { Popover } from '@base-ui/react/popover';
import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react';
import {
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { Calendar } from '../calendar/calendar';
import { resolveDateLocale } from '../calendar/locales';
import { controlFocus, controlSurface } from '../field/control-styles';
import { cn, touchHitArea } from '../lib/cn';
import { popupMotion } from '../select/select';
import { RangeCalendar, type DateRangePreset } from './range-calendar';
import { usePortalContainer } from '../theme-scope/theme-scope';
import { datePattern, parseDate, formatDisplayDate, type DateDisplayFormat } from './date-format';

export { datePattern, parseDate, formatDisplayDate, type DateDisplayFormat } from './date-format';

/**
 * The day the calendar would focus itself: the one in its tab order (selected, else today), else
 * the first enabled day. Base UI moves focus there when the popup opens.
 */
function dayToFocus(popup: HTMLElement | null): HTMLElement | true {
  const days = [...(popup?.querySelectorAll<HTMLButtonElement>('td button') ?? [])];
  return days.find((day) => day.tabIndex === 0) ?? days.find((day) => !day.disabled) ?? true;
}

function CalendarPopup({
  popupRef,
  anchor,
  children,
}: {
  popupRef: RefObject<HTMLDivElement | null>;
  /** Lines the popup up with the whole control rather than the small trigger inside it. */
  anchor?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const container = usePortalContainer();
  return (
    <Popover.Portal container={container}>
      {/* On phones the calendar becomes a sheet along the bottom edge, over a scrim, instead of a
          popup that hides the fields and actions below the input. */}
      <Popover.Backdrop
        className={cn(
          'fixed inset-0 z-50 hidden bg-scrim max-sm:block',
          'transition-opacity duration-base ease-standard data-ending-style:opacity-0 data-starting-style:opacity-0',
        )}
      />
      <Popover.Positioner
        sideOffset={6}
        align="start"
        collisionPadding={8}
        {...(anchor === undefined ? {} : { anchor })}
        className={cn(
          'z-50 outline-none',
          'max-sm:fixed! max-sm:inset-x-0! max-sm:top-auto! max-sm:bottom-0! max-sm:left-0! max-sm:transform-none!',
        )}
      >
        <Popover.Popup
          ref={popupRef}
          initialFocus={() => dayToFocus(popupRef.current)}
          data-slot="date-picker-popup"
          className={cn(
            'rounded-(--rx-popover-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-popover-shadow)',
            'max-sm:flex max-sm:flex-col max-sm:items-center max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-6',
            'outline-none',
            popupMotion,
          )}
        >
          {/* The sheet's own way out: touch screens have no Escape key. */}
          <div className="flex w-full justify-end px-2 pt-2 sm:hidden">
            <Popover.Close
              aria-label="Close calendar"
              className={cn(triggerButton, 'size-(--rx-button-height-touch)')}
            >
              <XIcon aria-hidden weight="bold" className="size-4" />
            </Popover.Close>
          </div>
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

const triggerButton = cn(
  'relative inline-flex size-(--rx-button-height-sm) shrink-0 cursor-pointer items-center justify-center',
  'rounded-(--rx-button-radius) text-fg-subtle hover:bg-surface-hover hover:text-fg',
  'transition-colors duration-fast ease-standard',
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled data-disabled:hover:bg-transparent',
  touchHitArea,
);

export interface DatePickerProps {
  value: Date | null;
  /** Called with a date when one is picked or a valid date is typed, null when cleared or unreadable. */
  onValueChange: (value: Date | null) => void;
  /** BCP 47 tag: the typed pattern, month names and first weekday follow it. */
  locale?: string;
  dateLocale?: DayPickerLocale;
  /**
   * How the field shows the date: a date-fns pattern such as `'d MMM yyyy'`, `'PP'` for the
   * locale's medium date, or a function. Typing in the locale's short pattern always works too.
   * Default `'P'`, the locale's short date.
   */
  displayFormat?: DateDisplayFormat;
  /** Defaults to the locale's pattern, such as `dd/mm/yyyy`, or the display pattern when set. */
  placeholder?: string;
  disabled?: boolean;
  /** Days that cannot be picked, in DayPicker matcher form, such as `{ after: new Date() }`. */
  disabledDays?: ComponentProps<typeof Calendar>['disabled'];
  /** Label of the calendar button. */
  calendarLabel?: string;
  name?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  className?: string;
  /** Only when no FieldLabel names the input. */
  'aria-label'?: string;
}

/**
 * A date field: type the date in the locale's short pattern, or open the calendar with the button
 * or Alt + Down. Wrap it in a Field for the label, description and error, like any input.
 */
export function DatePicker({
  value,
  onValueChange,
  locale,
  dateLocale: dateLocaleProp,
  displayFormat = 'P',
  placeholder,
  disabled = false,
  disabledDays,
  calendarLabel = 'Choose date',
  name,
  autoFocus,
  onBlur,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const dateLocale = dateLocaleProp ?? resolveDateLocale(locale);
  const formatDate = (date: Date) => formatDisplayDate(date, dateLocale, displayFormat);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => (value === null ? '' : formatDate(value)));
  const [shownValue, setShownValue] = useState(value);
  const groupRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Keep the text in step when the value changes from outside (picked, reset, loaded).
  if (value?.getTime() !== shownValue?.getTime()) {
    setShownValue(value);
    setText(value === null ? '' : formatDate(value));
  }

  const commit = () => {
    const parsed = parseDate(text, dateLocale, displayFormat);
    if (parsed !== null) setText(formatDate(parsed));
    if (parsed?.getTime() !== value?.getTime()) {
      setShownValue(parsed);
      onValueChange(parsed);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === 'Enter') {
      commit();
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        ref={groupRef}
        data-slot="date-picker"
        data-disabled={disabled || undefined}
        className={cn(
          controlSurface,
          'flex items-center gap-1 ps-(--rx-field-padding-x) pe-1',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
          'has-data-invalid:border-negative has-data-invalid:ring-1 has-data-invalid:ring-negative has-data-invalid:ring-inset',
          className,
        )}
      >
        <BaseField.Control
          name={name}
          value={text}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          placeholder={
            placeholder ??
            (displayFormat === 'P' || typeof displayFormat === 'function'
              ? datePattern(dateLocale)
              : displayFormat.toLowerCase())
          }
          autoComplete="off"
          // A pattern with month names needs letters; the short pattern needs only digits.
          inputMode={displayFormat === 'P' ? 'numeric' : 'text'}
          onValueChange={setText}
          onKeyDown={onKeyDown}
          onBlur={() => {
            commit();
            onBlur?.();
          }}
          className="h-full min-w-0 flex-1 bg-transparent outline-none numeric placeholder:text-fg-subtle data-disabled:cursor-not-allowed"
        />
        <Popover.Trigger
          disabled={disabled}
          aria-label={value === null ? calendarLabel : `${calendarLabel}, ${formatDate(value)}`}
          className={triggerButton}
        >
          <CalendarBlankIcon aria-hidden weight="bold" className="size-4" />
        </Popover.Trigger>
      </div>
      <CalendarPopup popupRef={popupRef} anchor={groupRef}>
        <Calendar
          mode="single"
          required={false}
          dateLocale={dateLocale}
          selected={value ?? undefined}
          {...(value === null ? {} : { defaultMonth: value })}
          disabled={disabledDays}
          onSelect={(date) => {
            // Pressing the chosen day again confirms it; it never empties the field.
            const next = date ?? value;
            setShownValue(next);
            setText(next === null ? '' : formatDate(next));
            onValueChange(next);
            setOpen(false);
          }}
        />
      </CalendarPopup>
    </Popover.Root>
  );
}

export interface DateRangePickerProps {
  value: DateRange | undefined;
  onValueChange: (value: DateRange | undefined) => void;
  locale?: string;
  dateLocale?: DayPickerLocale;
  /**
   * How the button shows each end of the range: a date-fns pattern or a function, as on
   * DatePicker. Default `'PP'`, the locale's medium date, such as 31 Dec 2026.
   */
  displayFormat?: DateDisplayFormat;
  /** Shown when no range is picked. */
  placeholder?: string;
  /** Months side by side. Two by default; they stack on narrow screens. */
  numberOfMonths?: number;
  disabledDays?: ComponentProps<typeof Calendar>['disabled'];
  disabled?: boolean;
  className?: string;
  /** Names the trigger, such as "Statement period". Required: the button has no Field label. */
  'aria-label': string;
  /**
   * Common periods beside the calendar, such as This month or Last quarter. One press picks the
   * whole range and closes. The preset matching the current value shows as pressed.
   */
  presets?: readonly DateRangePreset[];
}

/**
 * A period picker for filters and reports: a button showing the range, opening a RangeCalendar.
 * The first press sets the start, the second the end, then it closes. Closing early keeps the start.
 */
export function DateRangePicker({
  value,
  onValueChange,
  locale,
  dateLocale: dateLocaleProp,
  displayFormat = 'PP',
  placeholder = 'Choose dates',
  numberOfMonths = 2,
  disabledDays,
  disabled = false,
  className,
  'aria-label': ariaLabel,
  presets,
}: DateRangePickerProps) {
  const dateLocale = dateLocaleProp ?? resolveDateLocale(locale);
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const from = value?.from;
  const to = value?.to;
  const label =
    from === undefined
      ? placeholder
      : to === undefined
        ? `${formatDisplayDate(from, dateLocale, displayFormat)} to …`
        : `${formatDisplayDate(from, dateLocale, displayFormat)} to ${formatDisplayDate(to, dateLocale, displayFormat)}`;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        data-slot="date-range-picker"
        data-placeholder={from === undefined || undefined}
        aria-label={from === undefined ? ariaLabel : `${ariaLabel}, ${label}`}
        className={cn(
          controlSurface,
          controlFocus,
          'flex w-auto cursor-pointer items-center gap-2 px-(--rx-field-padding-x) text-start',
          'data-placeholder:text-fg-subtle data-popup-open:border-fg-subtle',
          className,
        )}
      >
        <CalendarBlankIcon aria-hidden weight="bold" className="size-4 shrink-0 text-fg-subtle" />
        <span className="truncate numeric">{label}</span>
      </Popover.Trigger>
      <CalendarPopup popupRef={popupRef}>
        <RangeCalendar
          value={value}
          onValueChange={onValueChange}
          onComplete={() => {
            setOpen(false);
          }}
          dateLocale={dateLocale}
          numberOfMonths={numberOfMonths}
          {...(presets === undefined ? {} : { presets })}
          disabledDays={disabledDays}
        />
      </CalendarPopup>
    </Popover.Root>
  );
}
