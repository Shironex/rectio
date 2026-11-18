import { Field as BaseField } from '@base-ui/react/field';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** The control surface shared by Input, AmountInput and the Select trigger. */
export const controlSurface = cn(
  'h-(--rx-field-height) w-full min-w-0 rounded-(--rx-field-radius)',
  'border border-(--rx-field-border) bg-(--rx-field-background) text-base text-fg',
  'transition-[border-color,outline-color] duration-fast ease-standard',
  'outline-0 -outline-offset-1 outline-transparent hover:border-fg-subtle',
  'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative data-invalid:ring-inset',
  'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
);

/**
 * Focus ring for the element that holds keyboard focus. It sits outside the border, so an invalid
 * field keeps its red edge while focused, and turns negative too so focus never reads as valid.
 */
export const controlFocus = cn(
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  'data-invalid:focus-visible:outline-negative',
);

export type FieldProps = WithClassName<ComponentProps<typeof BaseField.Root>>;

/** True when the app marked the field invalid itself (server errors, form libraries). */
const ExternalInvalidContext = createContext(false);

/** Groups a label, a control, its description and its error, and wires their ARIA links. */
export function Field({ className, invalid, ...props }: FieldProps) {
  return (
    <ExternalInvalidContext value={invalid === true}>
      <BaseField.Root
        data-slot="field"
        invalid={invalid}
        className={cn('flex flex-col gap-1.5', className)}
        {...props}
      />
    </ExternalInvalidContext>
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

/**
 * Shown when the control is invalid. Colour is never the only signal: it carries an icon and text.
 * Base UI shows an error only for a failed native or `validate` check; when the app sets
 * `<Field invalid>` itself, the error shows too, so a server message is never a bare red border.
 */
export function FieldError({ className, children, match, ...props }: FieldErrorProps) {
  const externalInvalid = use(ExternalInvalidContext);
  return (
    <BaseField.Error
      match={match ?? (externalInvalid ? true : undefined)}
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
