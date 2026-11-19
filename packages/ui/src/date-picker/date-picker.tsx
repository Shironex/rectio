import type { DateRange, DayPickerLocale } from '@daypicker/react';
import { Field as BaseField } from '@base-ui/react/field';
import { Popover } from '@base-ui/react/popover';
import { CalendarBlankIcon } from '@phosphor-icons/react';
import { format, isSameDay, isValid, parse } from 'date-fns';
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
import { controlFocus, controlSurface } from '../field/field';
import { cn } from '../lib/cn';
import { popupMotion } from '../select/select';
import { usePortalContainer } from '../theme-scope/theme-scope';

/**
 * The locale's short date pattern, written the way people read it: `dd/mm/yyyy`, `dd.mm.yyyy`.
 * Read from a formatted sample date, so the order and separators are exactly what parsing expects.
 */
export function datePattern(dateLocale: DayPickerLocale): string {
  return format(new Date(2026, 11, 31), 'P', { locale: dateLocale })
    .replace('2026', 'yyyy')
    .replace('31', 'dd')
    .replace('12', 'mm');
}

/** Typed text to a date in the locale's short pattern, or null. Four-digit years only. */
export function parseDate(text: string, dateLocale: DayPickerLocale): Date | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parsed = parse(trimmed, 'P', new Date(), { locale: dateLocale });
  return isValid(parsed) && parsed.getFullYear() >= 1000 ? parsed : null;
}

const formatDate = (date: Date, dateLocale: DayPickerLocale) =>
  format(date, 'P', { locale: dateLocale });

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
      <Popover.Positioner
        sideOffset={6}
        align="start"
        collisionPadding={8}
        {...(anchor === undefined ? {} : { anchor })}
        className="z-50 outline-none"
      >
        <Popover.Popup
          ref={popupRef}
          initialFocus={() => dayToFocus(popupRef.current)}
          data-slot="date-picker-popup"
          className={cn(
            'rounded-(--rx-popover-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-popover-shadow)',
            'outline-none',
            popupMotion,
          )}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

const triggerButton = cn(
  'inline-flex size-(--rx-button-height-sm) shrink-0 cursor-pointer items-center justify-center',
  'rounded-(--rx-button-radius) text-fg-subtle hover:bg-surface-hover hover:text-fg',
  'transition-colors duration-fast ease-standard',
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled data-disabled:hover:bg-transparent',
);

export interface DatePickerProps {
  value: Date | null;
  /** Called with a date when one is picked or a valid date is typed, null when cleared or unreadable. */
  onValueChange: (value: Date | null) => void;
  /** BCP 47 tag: the typed pattern, month names and first weekday follow it. */
  locale?: string;
  dateLocale?: DayPickerLocale;
  /** Defaults to the locale's pattern, such as `dd/mm/yyyy`. */
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
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => (value === null ? '' : formatDate(value, dateLocale)));
  const [shownValue, setShownValue] = useState(value);
  const groupRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Keep the text in step when the value changes from outside (picked, reset, loaded).
  if (value?.getTime() !== shownValue?.getTime()) {
    setShownValue(value);
    setText(value === null ? '' : formatDate(value, dateLocale));
  }

  const commit = () => {
    const parsed = parseDate(text, dateLocale);
    if (parsed !== null) setText(formatDate(parsed, dateLocale));
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
          placeholder={placeholder ?? datePattern(dateLocale)}
          autoComplete="off"
          inputMode="numeric"
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
          aria-label={
            value === null ? calendarLabel : `${calendarLabel}, ${formatDate(value, dateLocale)}`
          }
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
            const next = date ?? null;
            setShownValue(next);
            setText(next === null ? '' : formatDate(next, dateLocale));
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
  presets?: DateRangePreset[];
}

export interface DateRangePreset {
  label: string;
  range: { from: Date; to: Date };
}

const sameRange = (a: DateRange | undefined, b: DateRangePreset['range']) =>
  a?.from !== undefined && a.to !== undefined && isSameDay(a.from, b.from) && isSameDay(a.to, b.to);

/**
 * A period picker for filters and reports: a button showing the range, opening two months. The
 * first press sets the start, the second the end, then it closes. Closing early keeps the start.
 */
export function DateRangePicker({
  value,
  onValueChange,
  locale,
  dateLocale: dateLocaleProp,
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
  const pickingEnd = useRef(false);
  const onOpenChange = (next: boolean) => {
    pickingEnd.current = false;
    setOpen(next);
  };
  const from = value?.from;
  const to = value?.to;
  const label =
    from === undefined
      ? placeholder
      : to === undefined
        ? `${format(from, 'PP', { locale: dateLocale })} to …`
        : `${format(from, 'PP', { locale: dateLocale })} to ${format(to, 'PP', { locale: dateLocale })}`;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
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
        <div className="flex flex-col sm:flex-row">
          {presets !== undefined && presets.length > 0 && (
            <ul
              aria-label="Common periods"
              className="flex flex-wrap gap-1 border-b border-line p-2 sm:w-40 sm:flex-col sm:flex-nowrap sm:border-e sm:border-b-0"
            >
              {presets.map((preset) => (
                <li key={preset.label}>
                  <button
                    type="button"
                    aria-pressed={sameRange(value, preset.range)}
                    onClick={() => {
                      onValueChange({ ...preset.range });
                      onOpenChange(false);
                    }}
                    className={cn(
                      'flex h-(--rx-button-height-sm) w-full cursor-pointer items-center rounded-(--rx-button-radius) px-(--rx-button-padding-x-sm)',
                      'text-start text-sm whitespace-nowrap text-fg-muted hover:bg-surface-hover hover:text-fg',
                      'aria-pressed:bg-surface-selected aria-pressed:font-medium aria-pressed:text-fg',
                      'transition-colors duration-fast ease-standard',
                      'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                    )}
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Calendar
            mode="range"
            required={false}
            dateLocale={dateLocale}
            numberOfMonths={numberOfMonths}
            // Side by side months would repeat the days where they meet.
            showOutsideDays={numberOfMonths === 1}
            selected={value}
            {...(from === undefined ? {} : { defaultMonth: from })}
            disabled={disabledDays}
            onSelect={(range, picked) => {
              // Each opening picks a fresh period: the first press is the start, the second the end.
              if (!pickingEnd.current) {
                pickingEnd.current = true;
                onValueChange({ from: picked, to: undefined });
                return;
              }
              onValueChange(range);
              pickingEnd.current = false;
              setOpen(false);
            }}
          />
        </div>
      </CalendarPopup>
    </Popover.Root>
  );
}
