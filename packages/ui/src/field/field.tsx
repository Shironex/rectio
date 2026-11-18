import { Field as BaseField } from '@base-ui/react/field';
import { WarningCircleIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** The control surface shared by Input, AmountInput and the Select trigger. */
export const controlSurface = cn(
  'h-(--rx-field-height) w-full min-w-0 rounded-(--rx-field-radius)',
  'border border-(--rx-field-border) bg-(--rx-field-background) text-base text-fg',
  'transition-[border-color,outline-color] duration-fast ease-standard',
  'outline-0 -outline-offset-1 outline-transparent hover:border-fg-subtle',
  'data-invalid:border-negative',
  'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
);

/** Focus ring for the element that holds keyboard focus (or contains it). */
export const controlFocus = 'focus-visible:outline-2 focus-visible:outline-focus';

export type FieldProps = WithClassName<ComponentProps<typeof BaseField.Root>>;

/** Groups a label, a control, its description and its error, and wires their ARIA links. */
export function Field({ className, ...props }: FieldProps) {
  return (
    <BaseField.Root
      data-slot="field"
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

export type FieldLabelProps = WithClassName<ComponentProps<typeof BaseField.Label>>;

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cn('w-fit text-sm font-medium text-fg data-disabled:text-fg-disabled', className)}
      {...props}
    />
  );
}

export type FieldDescriptionProps = WithClassName<ComponentProps<typeof BaseField.Description>>;

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return <BaseField.Description className={cn('text-sm text-fg-subtle', className)} {...props} />;
}

export type FieldErrorProps = WithClassName<ComponentProps<typeof BaseField.Error>> & {
  children: ReactNode;
};

/** Shown when the control is invalid. Colour is never the only signal: it carries an icon. */
export function FieldError({ className, children, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error
      className={cn(
        'flex items-start gap-1.5 text-sm text-negative-strong',
        'transition-[opacity,translate] duration-fast ease-enter',
        'data-starting-style:-translate-y-(--rx-motion-distance-shift) data-starting-style:opacity-0',
        'data-ending-style:opacity-0',
        className,
      )}
      {...props}
    >
      <WarningCircleIcon aria-hidden weight="bold" className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </BaseField.Error>
  );
}

export type InputProps = WithClassName<ComponentProps<typeof BaseField.Control>>;

export function Input({ className, ...props }: InputProps) {
  return (
    <BaseField.Control
      data-slot="input"
      className={cn(
        controlSurface,
        controlFocus,
        'px-(--rx-field-padding-x) placeholder:text-fg-subtle',
        className,
      )}
      {...props}
    />
  );
}
