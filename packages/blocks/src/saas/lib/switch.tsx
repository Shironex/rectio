import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '@rectio/ui';
import type { ComponentProps } from 'react';

import { touchTarget } from './styles';

export interface SwitchProps extends Omit<ComponentProps<typeof BaseSwitch.Root>, 'className'> {
  className?: string;
}

/**
 * An on and off setting that applies at once. Name it with a wrapping label, `aria-label` or
 * `aria-labelledby`. The block-local piece stands in for a shared Switch component.
 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      data-slot="switch"
      className={cn(
        'group/switch relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5',
        'border border-line-strong bg-surface-sunken',
        'transition-[background-color,border-color] duration-fast ease-standard',
        'data-checked:border-accent data-checked:bg-accent',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken',
        touchTarget,
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb
        className={cn(
          'block size-3.5 rounded-full bg-fg-muted shadow-raised',
          'transition-[translate,background-color] duration-fast ease-standard',
          'data-checked:translate-x-4 data-checked:bg-accent-contrast rtl:data-checked:-translate-x-4',
          'group-data-disabled/switch:bg-fg-disabled',
        )}
      />
    </BaseSwitch.Root>
  );
}
