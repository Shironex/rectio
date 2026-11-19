import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { MinusIcon, PlusIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { controlSurface } from '../field/field';
import { cn } from '../lib/cn';

export interface NumberFieldProps extends Omit<
  ComponentProps<typeof BaseNumberField.Root>,
  'className'
> {
  className?: string;
  /**
   * Intl number format options: `{ style: 'percent' }`, `{ style: 'unit', unit: 'day' }`,
   * `{ maximumFractionDigits: 0 }`. Typed text is parsed with the same rules.
   */
  format?: Intl.NumberFormatOptions;
  /** BCP 47 locale for grouping, decimals and units. */
  locale?: string;
  /**
   * A fixed unit after the figure, such as "seats" or "h". Decorative: name the unit in the label
   * too ("Seats", "Hours per week"). For a unit that should be part of the value, use `format`.
   */
  unit?: ReactNode;
  placeholder?: string;
  /** Hide the stepper buttons; arrow keys, Page Up and Page Down still step. */
  hideStepper?: boolean;
  /** Accessible names of the stepper buttons. */
  decrementLabel?: string;
  incrementLabel?: string;
  /** Only when no FieldLabel names the input. */
  'aria-label'?: string;
}

/**
 * A square stepper button as tall as the field, so it is a 44px target on touch screens. Out of the
 * tab order (arrow keys step from the input), pressable and holdable with a pointer.
 */
const stepper = cn(
  'flex h-full w-(--rx-field-height) pointer-coarse:w-(--rx-field-height-touch) shrink-0 cursor-pointer items-center justify-center',
  'border-s border-line text-fg-muted select-none',
  'transition-[background-color,color] duration-fast ease-standard',
  'hover:bg-surface-hover hover:text-fg active:bg-surface-sunken',
  'data-disabled:cursor-not-allowed data-disabled:bg-transparent data-disabled:text-fg-disabled',
);

/**
 * A number entry field with a stepper, on Base UI's NumberField. Arrow keys step by `step`, Page Up
 * and Page Down by `largeStep`, Home and End jump to `min` and `max`, and the buttons can be held.
 * It formats with Intl in the given locale (percent, units, fixed decimals) and sets figures in the
 * tabular numeric face, like AmountInput. Wrap it in a Field for the label, description and error.
 */
export function NumberField({
  format,
  locale,
  unit,
  placeholder,
  hideStepper = false,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  'aria-label': ariaLabel,
  className,
  ...props
}: NumberFieldProps) {
  return (
    <BaseNumberField.Root
      data-slot="number-field"
      locale={locale}
      format={format}
      className={cn('w-full', className)}
      {...props}
    >
      <BaseNumberField.Group
        className={cn(
          controlSurface,
          // Clips the last button's background to the field's corner radius.
          'flex items-center overflow-hidden numeric',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
        )}
      >
        <BaseNumberField.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            // Right-aligned, like AmountInput and the column the figure feeds.
            'h-full min-w-0 flex-1 bg-transparent px-(--rx-field-padding-x) text-end outline-none placeholder:text-fg-subtle',
            'data-disabled:cursor-not-allowed',
          )}
        />
        {unit !== undefined && (
          <span
            aria-hidden
            className="-ms-1 shrink-0 pe-(--rx-field-padding-x) text-fg-subtle select-none"
          >
            {unit}
          </span>
        )}
        {!hideStepper && (
          <>
            <BaseNumberField.Decrement aria-label={decrementLabel} className={stepper}>
              <MinusIcon aria-hidden weight="bold" className="size-3.5" />
            </BaseNumberField.Decrement>
            <BaseNumberField.Increment aria-label={incrementLabel} className={stepper}>
              <PlusIcon aria-hidden weight="bold" className="size-3.5" />
            </BaseNumberField.Increment>
          </>
        )}
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
