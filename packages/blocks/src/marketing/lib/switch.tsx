import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn, touchHitArea } from '@rectio/ui';
import type { ComponentProps } from 'react';

/**
 * An on and off switch. Internal to the marketing blocks until the kit's own Switch lands; swap it
 * in then. A disabled switch that is on reads as "always on", as a required cookie category is.
 */
export function Switch({
  className,
  ...props
}: Omit<ComponentProps<typeof BaseSwitch.Root>, 'className'> & { className?: string }) {
  return (
    <BaseSwitch.Root
      className={cn(
        'group/switch relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-sunken p-0.5',
        'transition-colors duration-fast ease-standard',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'data-checked:border-accent data-checked:bg-accent',
        'data-disabled:cursor-not-allowed data-disabled:opacity-60',
        touchHitArea,
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb
        className={cn(
          'size-4.5 rounded-full bg-surface-raised shadow-raised',
          'transition-transform duration-fast ease-standard',
          'data-checked:translate-x-4 rtl:data-checked:-translate-x-4',
        )}
      />
    </BaseSwitch.Root>
  );
}
