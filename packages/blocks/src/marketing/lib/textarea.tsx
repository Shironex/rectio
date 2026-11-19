import { Field as BaseField } from '@base-ui/react/field';
import { cn } from '@rectio/ui';
import type { ComponentProps } from 'react';

/**
 * A multi-line text field that pairs with the kit's Field, Label and Error. Internal to the
 * marketing blocks until the kit has its own; swap it in then.
 */
export function Textarea({
  className,
  rows = 5,
  ...props
}: Omit<ComponentProps<typeof BaseField.Control>, 'className'> & {
  className?: string;
  rows?: number;
}) {
  return (
    <BaseField.Control
      render={<textarea rows={rows} />}
      className={cn(
        'min-h-32 w-full min-w-0 resize-y rounded-(--rx-field-radius) border border-(--rx-field-border) bg-(--rx-field-background)',
        'px-(--rx-field-padding-x) py-2 text-base text-fg placeholder:text-fg-subtle',
        'transition-[border-color,outline-color] duration-fast ease-standard hover:border-fg-subtle',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative data-invalid:ring-inset',
        className,
      )}
      {...props}
    />
  );
}
