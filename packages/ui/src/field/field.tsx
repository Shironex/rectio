import { Field as BaseField } from '@base-ui/react/field';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** The control surface shared by Input, AmountInput and the Select trigger. */
export const controlSurface = cn(
  // Taller on touch screens, a 44px target, without touching desktop density.
  'h-(--rx-field-height) pointer-coarse:h-(--rx-field-height-touch) w-full min-w-0 rounded-(--rx-field-radius)',
  'border border-(--rx-field-border) bg-(--rx-field-background) text-base text-fg',
  'transition-[border-color,outline-color] duration-fast ease-standard',
  'outline-0 -outline-offset-1 outline-transparent hover:border-fg-subtle',
  'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative data-invalid:ring-inset',
  'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
);

/**
 * Focus ring for the element that holds keyboard focus. One signal everywhere: it sits outside the
 * border, so an invalid field shows its red edge and the focus ring together.
 */
export const controlFocus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

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

export type FieldLabelProps = WithClassName<ComponentProps<typeof BaseField.Label>> & {
  /**
   * Marks the field as optional. Forms mark the minority: when most fields are required, label the
   * optional ones, and the rest read as required.
   */
  optional?: boolean;
};

export function FieldLabel({ className, optional = false, children, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cn(
        'flex w-fit items-baseline gap-1.5 text-sm font-medium text-fg data-disabled:text-fg-disabled',
        className,
      )}
      {...props}
    >
      {children}
      {/* The space keeps "Note Optional" as two words in the accessible name; flex drops it visually. */}
      {optional && ' '}
      {optional && <span className="font-regular text-fg-subtle">Optional</span>}
    </BaseField.Label>
  );
}

export type FieldDescriptionProps = WithClassName<ComponentProps<typeof BaseField.Description>>;

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return <BaseField.Description className={cn('text-sm text-fg-subtle', className)} {...props} />;
}

export type FieldErrorProps = WithClassName<ComponentProps<typeof BaseField.Error>> & {
  /**
   * The message. Leave it empty (`null`, `false` or `''`) to show the browser's own validation
   * message, or nothing at all when there is none: the icon never shows without words.
   */
  children?: ReactNode;
};

/** True when a node would render no text: nothing, a boolean, or an empty string. */
const isEmpty = (node: ReactNode) =>
  node === null || node === undefined || typeof node === 'boolean' || node === '';

/**
 * Shown when the control is invalid. Colour is never the only signal: it carries an icon and text,
 * and the icon sits on the first line's centre, so it stays level with a message of any length.
 * Base UI shows an error only for a failed native or `validate` check; when the app sets
 * `<Field invalid>` itself, the error shows too, so a server message is never a bare red border.
 * An empty message renders nothing: a lone warning icon is never left under the field.
 */
export function FieldError({ className, children, match, ...props }: FieldErrorProps) {
  const externalInvalid = use(ExternalInvalidContext);
  const empty = isEmpty(children);
  return (
    <BaseField.Error
      // Only a message of the app's own forces the error open; an empty one waits for a real check.
      match={match ?? (externalInvalid && !empty ? true : undefined)}
      className={cn(
        'flex items-start gap-1.5 text-sm text-negative-strong',
        'transition-[opacity,translate] duration-fast ease-enter',
        'data-starting-style:-translate-y-(--rx-motion-distance-shift) data-starting-style:opacity-0',
        'data-ending-style:opacity-0',
        className,
      )}
      // Base UI fills the children with the check's message when the app passes none.
      render={(renderProps) => {
        const message: ReactNode = empty ? renderProps.children : children;
        return (
          <div {...renderProps} data-slot="field-error" hidden={isEmpty(message) || undefined}>
            {!isEmpty(message) && (
              <>
                <span aria-hidden className="flex h-lh shrink-0 items-center">
                  <WarningCircleIcon weight="bold" className="size-3.5" />
                </span>
                <span className="min-w-0">{message}</span>
              </>
            )}
          </div>
        );
      }}
      {...props}
    />
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
