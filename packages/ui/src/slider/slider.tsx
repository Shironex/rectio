import { Slider as BaseSlider } from '@base-ui/react/slider';
import type { ComponentProps, ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type SliderProps = WithClassName<ComponentProps<typeof BaseSlider.Root>> & {
  /**
   * A label inside the slider, set on one line with the value. Inside a Field, a FieldLabel above
   * names the slider just as well.
   */
  label?: ReactNode;
  /** Shows the current value, formatted with `format` and `locale`, at the end of the top line. */
  showValue?: boolean;
  /**
   * Draws the value under the track. `true` labels the ends (min and max); an array labels those
   * values and draws a tick for each one inside the track.
   */
  marks?: boolean | readonly number[];
  /**
   * Accessible names for the thumbs of a range, such as `['Minimum amount', 'Maximum amount']`.
   * A single thumb takes its name from the label.
   */
  thumbLabels?: readonly [string, string];
  /**
   * Writes the shown value from the formatted values. A range reads "€20 to €80" by default; pass
   * this for another wording or language.
   */
  formatValue?: (formatted: readonly string[], values: readonly number[]) => ReactNode;
};

const percent = (value: number, min: number, max: number) => ((value - min) / (max - min)) * 100;

function defaultFormatValue(formatted: readonly string[]) {
  return formatted.length > 1 ? `${formatted[0] ?? ''} to ${formatted[1] ?? ''}` : formatted[0];
}

/**
 * A slider on Base UI, for a value where the rough position matters more than the exact figure: a
 * threshold, a discount, a price range. Pass an array as the value for a range with two thumbs.
 * Arrow keys step by `step`, Page Up and Page Down by `largeStep`, Home and End jump to the ends.
 * Values are formatted with Intl: pass `format` (currency, percent) and `locale`. Moving the thumb
 * never animates; it follows the pointer and the keys directly.
 */
export function Slider({
  label,
  showValue = false,
  marks,
  thumbLabels,
  formatValue = defaultFormatValue,
  className,
  min = 0,
  max = 100,
  format,
  locale,
  value,
  defaultValue,
  ...props
}: SliderProps) {
  const initial = value ?? defaultValue;
  const thumbs = Array.isArray(initial) ? initial.length : 1;
  const formatter = new Intl.NumberFormat(locale, format);
  const listed = typeof marks === 'object' ? marks : null;
  const markValues: readonly number[] = marks === true ? [min, max] : (listed ?? []);
  const ticks = listed === null ? [] : listed.filter((m) => m > min && m < max);

  return (
    <BaseSlider.Root
      data-slot="slider"
      min={min}
      max={max}
      format={format}
      locale={locale}
      value={value}
      defaultValue={defaultValue}
      className={cn('flex w-full flex-col gap-1.5', className)}
      {...props}
    >
      {(label !== undefined || showValue) && (
        <div className="flex items-baseline justify-between gap-3">
          {label !== undefined && (
            <BaseSlider.Label className="text-sm font-medium text-fg data-disabled:text-fg-disabled">
              {label}
            </BaseSlider.Label>
          )}
          {showValue && (
            <BaseSlider.Value
              data-slot="slider-value"
              className="ms-auto text-sm text-fg-muted numeric data-disabled:text-fg-disabled"
            >
              {(formatted, values) => formatValue(formatted, values)}
            </BaseSlider.Value>
          )}
        </div>
      )}
      <BaseSlider.Control
        className={cn(
          'flex h-5 w-full cursor-pointer touch-none items-center select-none',
          'pointer-coarse:h-(--rx-field-height-touch)',
          'data-disabled:cursor-not-allowed',
        )}
      >
        <BaseSlider.Track className="relative h-1.5 w-full rounded-full bg-line select-none">
          <BaseSlider.Indicator
            data-slot="slider-indicator"
            className="rounded-full bg-accent data-disabled:bg-fg-disabled data-invalid:bg-negative"
          />
          {ticks.map((mark) => (
            <span
              key={mark}
              aria-hidden
              className="absolute top-1/2 size-1 -translate-1/2 rounded-full bg-fg-subtle"
              style={{ insetInlineStart: `${String(percent(mark, min, max))}%` }}
            />
          ))}
          {Array.from({ length: thumbs }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              data-slot="slider-thumb"
              {...(thumbs > 1 && thumbLabels !== undefined
                ? { 'aria-label': thumbLabels[index] }
                : {})}
              className={cn(
                'size-4 rounded-full border-2 border-accent bg-surface-raised shadow-raised select-none',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                'data-invalid:border-negative',
                'data-disabled:border-fg-disabled data-disabled:shadow-none',
                touchHitArea,
              )}
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
      {markValues.length > 0 && (
        // Decorative: every value is also announced by the thumbs themselves.
        <div aria-hidden className="relative h-4 text-xs text-fg-subtle numeric select-none">
          {markValues.map((mark) => {
            const at = percent(mark, min, max);
            // The ends align to the edges so their labels never overflow the slider.
            const align =
              at <= 0
                ? ''
                : at >= 100
                  ? '-translate-x-full rtl:translate-x-full'
                  : '-translate-x-1/2 rtl:translate-x-1/2';
            return (
              <span
                key={mark}
                className={cn('absolute top-0 whitespace-nowrap', align)}
                style={{ insetInlineStart: `${String(at)}%` }}
              >
                {formatter.format(mark)}
              </span>
            );
          })}
        </div>
      )}
    </BaseSlider.Root>
  );
}
