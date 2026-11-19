import { Fieldset } from '@base-ui/react/fieldset';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { useId, type ComponentProps, type ReactNode } from 'react';

import { controlFocus } from '../field/field';
import { cn, touchHitArea } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type RadioGroupProps = WithClassName<ComponentProps<typeof BaseRadioGroup>> & {
  /**
   * The question the options answer, such as "Billing period". It names the group the way a
   * fieldset legend does. Without it, give the group an `aria-label` or `aria-labelledby`.
   */
  legend?: ReactNode;
};

/**
 * A radio group on Base UI: one choice from a few options that stay visible. Arrow keys move the
 * choice; Tab leaves the group. Inside a Field it carries the field's description, error and
 * disabled state; name the group with `legend`, not a FieldLabel, so a click on the question
 * never picks the first option.
 */
export function RadioGroup({ legend, disabled, className, children, ...props }: RadioGroupProps) {
  return (
    <Fieldset.Root
      data-slot="radio-group"
      disabled={disabled}
      render={<BaseRadioGroup disabled={disabled} {...props} />}
      className={cn('flex flex-col gap-2.5', className)}
    >
      {legend !== undefined && (
        <Fieldset.Legend
          data-slot="radio-group-legend"
          className="col-span-full text-sm font-medium text-fg data-disabled:text-fg-disabled"
        >
          {legend}
        </Fieldset.Legend>
      )}
      {children}
    </Fieldset.Root>
  );
}

/** The drawn circle. A dot marks the choice, so the state never rests on colour alone. */
function RadioControl({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full',
        'border border-(--rx-field-border) bg-(--rx-field-background)',
        'transition-[background-color,border-color] duration-fast ease-standard',
        'group-data-checked/radio:border-accent group-data-checked/radio:bg-accent',
        'group-data-invalid/radio:border-negative',
        'group-data-disabled/radio:border-line group-data-disabled/radio:bg-surface-sunken',
        className,
      )}
    >
      <BaseRadio.Indicator
        className={cn(
          'size-1.5 rounded-full bg-accent-contrast group-data-disabled/radio:bg-fg-disabled',
          // The dot grows from half size, never from nothing; under reduced motion it just appears.
          'transition-[scale,opacity] duration-fast ease-enter',
          'data-starting-style:scale-50 data-starting-style:opacity-0',
          'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
        )}
      />
    </span>
  );
}

export type RadioProps = WithClassName<ComponentProps<typeof BaseRadio.Root>> & {
  /** The option's label. Pressing it picks the option. */
  children?: ReactNode;
  /** A second line under the label, linked to the radio as its description. */
  description?: ReactNode;
};

/** One option with its label beside it. Use it inside a RadioGroup. */
export function Radio({ className, children, description, ...props }: RadioProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  return (
    // The wrapping label makes the text pressable. The radio is named by the text itself: inside a
    // Field, Base UI would otherwise hand every radio the field's one label id.
    <label
      data-slot="radio"
      className={cn(
        'flex w-fit items-start gap-2.5 text-base text-fg',
        'has-data-disabled:cursor-not-allowed has-data-disabled:text-fg-disabled',
        className,
      )}
    >
      <BaseRadio.Root
        {...(children === undefined ? {} : { 'aria-labelledby': labelId })}
        {...(description === undefined ? {} : { 'aria-describedby': descriptionId })}
        {...props}
        className={cn(
          'group/radio relative mt-0.5 flex shrink-0 cursor-pointer rounded-full outline-offset-2',
          'focus-visible:outline-2 focus-visible:outline-focus',
          'data-disabled:cursor-not-allowed',
          // A larger hit area than the drawn circle, the touch height on touch screens.
          'after:absolute after:-inset-2',
          touchHitArea,
        )}
      >
        <RadioControl />
      </BaseRadio.Root>
      {(children !== undefined || description !== undefined) && (
        <span className="flex min-w-0 flex-col gap-0.5">
          {children !== undefined && <span id={labelId}>{children}</span>}
          {description !== undefined && (
            <span id={descriptionId} className="text-sm text-fg-subtle">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

export type RadioCardProps = WithClassName<ComponentProps<typeof BaseRadio.Root>> & {
  /** The option's name, such as a plan. It names the radio. */
  title: ReactNode;
  /** What the option includes. Linked to the radio as its description. */
  description?: ReactNode;
  /** Trailing detail such as a price, set in tabular figures and read after the description. */
  meta?: ReactNode;
};

/**
 * An option drawn as a card, for plan and method pickers. The whole card is the radio. The chosen
 * card gets an accent border and a filled circle with a dot, so the choice shows without colour.
 * Lay several out with `className` on the RadioGroup, such as `grid gap-3 sm:grid-cols-3`.
 */
export function RadioCard({ title, description, meta, className, ...props }: RadioCardProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const describedBy = [
    description === undefined ? null : `${id}-description`,
    meta === undefined ? null : `${id}-meta`,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <BaseRadio.Root
      data-slot="radio-card"
      aria-labelledby={titleId}
      {...(describedBy === '' ? {} : { 'aria-describedby': describedBy })}
      {...props}
      className={cn(
        'group/radio relative flex cursor-pointer items-start gap-3 p-4 text-start',
        'rounded-panel border border-line bg-surface text-fg',
        'transition-[background-color,border-color,box-shadow] duration-fast ease-standard',
        'hover:border-line-strong',
        // Border and an inset ring together: a 2px edge without shifting the content.
        'data-checked:border-accent data-checked:bg-accent-subtle data-checked:ring-1 data-checked:ring-accent data-checked:ring-inset',
        'data-invalid:border-negative',
        controlFocus,
        'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
        className,
      )}
    >
      <RadioControl className="mt-0.5" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={titleId} className="font-medium">
          {title}
        </span>
        {description !== undefined && (
          <span
            id={`${id}-description`}
            className="text-sm text-fg-subtle group-data-disabled/radio:text-fg-disabled"
          >
            {description}
          </span>
        )}
      </span>
      {meta !== undefined && (
        <span id={`${id}-meta`} className="shrink-0 font-medium numeric">
          {meta}
        </span>
      )}
    </BaseRadio.Root>
  );
}
