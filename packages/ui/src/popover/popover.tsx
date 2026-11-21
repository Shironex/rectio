'use client';

import { Popover as BasePopover } from '@base-ui/react/popover';
import { XIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';
import { popupMotion } from '../select/select';
import { usePortalContainer } from '../theme-scope/theme-scope';
import { popoverSurface } from './popover-surface';

export { popoverSurface } from './popover-surface';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };
type PositionerProps = ComponentProps<typeof BasePopover.Positioner>;

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;

export type PopoverContentProps = WithClassName<ComponentProps<typeof BasePopover.Popup>> & {
  side?: PositionerProps['side'];
  align?: PositionerProps['align'];
  sideOffset?: number;
  /** A close button in the corner, named by `closeLabel`. Escape and an outside press close it too. */
  showClose?: boolean;
  closeLabel?: string;
  children: ReactNode;
};

/**
 * Anchored content the user opened on purpose: a filter form, a detail, a short choice. Focus
 * moves in when it opens and returns to the trigger when it closes. Portals into the nearest
 * ThemeScope.
 */
export function PopoverContent({
  className,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  showClose = false,
  closeLabel = 'Close',
  ...props
}: PopoverContentProps) {
  const container = usePortalContainer();
  return (
    <BasePopover.Portal container={container}>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className="z-50"
      >
        <BasePopover.Popup
          data-slot="popover"
          className={cn(
            'relative flex max-w-(--available-width) min-w-56 flex-col gap-2 p-4',
            popoverSurface,
            popupMotion,
            showClose && 'pe-12',
            className,
          )}
          {...props}
        >
          {children}
          {showClose && (
            <BasePopover.Close
              aria-label={closeLabel}
              className={cn(
                'absolute end-2 top-2 inline-flex size-(--rx-button-height-sm) cursor-pointer items-center justify-center',
                'rounded-(--rx-button-radius) text-fg-subtle hover:bg-surface-hover hover:text-fg',
                'transition-colors duration-fast ease-standard',
                'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                touchHitArea,
              )}
            >
              <XIcon aria-hidden weight="bold" className="size-4" />
            </BasePopover.Close>
          )}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export type PopoverTitleProps = WithClassName<ComponentProps<typeof BasePopover.Title>>;

export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title className={cn('text-base font-medium text-fg', className)} {...props} />
  );
}

export type PopoverDescriptionProps = WithClassName<ComponentProps<typeof BasePopover.Description>>;

export function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return <BasePopover.Description className={cn('text-sm text-fg-muted', className)} {...props} />;
}
