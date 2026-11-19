import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ComponentProps, ReactNode } from 'react';

import { Field, FieldDescription, FieldLabel, controlFocus } from '../field/field';
import { cn, touchHitArea } from '../lib/cn';

export interface SwitchProps extends Omit<ComponentProps<typeof BaseSwitch.Root>, 'className'> {
  className?: string;
  /** Class for the thumb, for the motion add-on or a one-off restyle. */
  thumbClassName?: string;
}

/**
 * A switch on Base UI, for a setting that applies at once (notifications, two-step sign-in). On
 * is the filled track with the thumb at the end, so position tells the state as well as colour.
 * Name it with a FieldLabel, a wrapping label, or `aria-label`. For a form that applies on submit,
 * a Checkbox reads better.
 */
export function Switch({ className, thumbClassName, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      data-slot="switch"
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5',
        'border border-(--rx-field-border) bg-surface-sunken',
        'transition-[background-color,border-color] duration-fast ease-standard',
        'hover:border-fg-subtle',
        'data-checked:border-accent data-checked:bg-accent data-checked:hover:border-accent-hover data-checked:hover:bg-accent-hover',
        'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative',
        controlFocus,
        'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken',
        // A larger target than the drawn track: 36 by 28 to press with a mouse, the touch height
        // on touch screens.
        'after:absolute after:-inset-1',
        touchHitArea,
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb
        data-slot="switch-thumb"
        className={cn(
          'block size-3.5 rounded-full bg-surface-raised shadow-raised',
          'transition-[translate,background-color] duration-fast ease-standard',
          // Track 36 wide, 1px border and 2px padding each side, a 14px thumb: 16px of travel.
          'data-checked:translate-x-4 rtl:data-checked:-translate-x-4',
          'data-disabled:bg-surface data-disabled:shadow-none data-disabled:data-checked:bg-fg-disabled',
          thumbClassName,
        )}
      />
    </BaseSwitch.Root>
  );
}

export interface SwitchFieldProps extends SwitchProps {
  /** Names the switch. Pressing it toggles the switch too. */
  label: ReactNode;
  /** One line on what the setting does, linked to the switch as its description. */
  description?: ReactNode;
  /** Marks the row invalid and shows a FieldError passed as children. */
  invalid?: boolean;
  /** Class for the row; `className` styles the switch. */
  fieldClassName?: string;
  /** A FieldError, shown under the description. */
  children?: ReactNode;
}

/**
 * A settings row: label and description on the left, the switch on the right. It is a Field, so
 * the label names the switch, the description and any FieldError are linked to it, and
 * `disabled` greys the whole row.
 */
export function SwitchField({
  label,
  description,
  invalid,
  disabled,
  fieldClassName,
  className,
  children,
  ...props
}: SwitchFieldProps) {
  return (
    <Field
      data-slot="switch-field"
      invalid={invalid}
      disabled={disabled}
      className={cn('flex-row items-start justify-between gap-4', fieldClassName)}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <FieldLabel className="cursor-pointer data-disabled:cursor-not-allowed">{label}</FieldLabel>
        {description !== undefined && <FieldDescription>{description}</FieldDescription>}
        {children}
      </div>
      <Switch disabled={disabled} className={cn('mt-px', className)} {...props} />
    </Field>
  );
}
