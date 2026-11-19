import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';

import { cn, touchHitArea } from '../lib/cn';

export interface CheckboxProps extends Omit<ComponentProps<typeof BaseCheckbox.Root>, 'className'> {
  className?: string;
}

/**
 * A checkbox on Base UI. Indeterminate shows a bar, for a "select all" that covers some rows. Name
 * it with a FieldLabel, a wrapping label, or `aria-label` when it stands alone in a table cell.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={cn(
        'relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center',
        'rounded-(--rx-badge-radius) border border-(--rx-field-border) bg-(--rx-field-background) text-accent-contrast',
        'transition-[background-color,border-color] duration-fast ease-standard',
        'hover:border-fg-subtle',
        'data-checked:border-accent data-checked:bg-accent data-indeterminate:border-accent data-indeterminate:bg-accent',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
        // A larger hit area than the drawn box, so a dense table row stays easy to tick.
        // 32px to press with a mouse, the touch height on touch screens at any density.
        'after:absolute after:-inset-2',
        touchHitArea,
        className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator
        className="flex"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <MinusIcon aria-hidden weight="bold" className="size-3" />
            ) : (
              <CheckIcon aria-hidden weight="bold" className="size-3" />
            )}
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );
}
