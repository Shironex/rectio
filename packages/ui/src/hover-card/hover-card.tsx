'use client';

import { PreviewCard } from '@base-ui/react/preview-card';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { popoverSurface } from '../popover/popover';
import { popupMotion } from '../select/select';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };
type PositionerProps = ComponentProps<typeof PreviewCard.Positioner>;

export const HoverCard = PreviewCard.Root;

export type HoverCardTriggerProps = WithClassName<ComponentProps<typeof PreviewCard.Trigger>>;

/**
 * A link that previews where it goes: a customer, a supplier, an account. It stays an ordinary
 * link, so touch and keyboard users still reach the page; the card only adds a glance.
 */
export function HoverCardTrigger({
  className,
  delay = 500,
  closeDelay = 250,
  ...props
}: HoverCardTriggerProps) {
  return (
    <PreviewCard.Trigger
      data-slot="hover-card-trigger"
      delay={delay}
      closeDelay={closeDelay}
      className={cn(
        'cursor-pointer text-accent-strong underline decoration-line-strong underline-offset-4',
        'hover:decoration-current focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    />
  );
}

export type HoverCardContentProps = WithClassName<ComponentProps<typeof PreviewCard.Popup>> & {
  side?: PositionerProps['side'];
  align?: PositionerProps['align'];
  sideOffset?: number;
  children: ReactNode;
};

/** The preview. Keep it to a summary; anything to act on belongs on the page the link opens. */
export function HoverCardContent({
  className,
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  ...props
}: HoverCardContentProps) {
  const container = usePortalContainer();
  return (
    <PreviewCard.Portal container={container}>
      <PreviewCard.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className="z-50"
      >
        <PreviewCard.Popup
          data-slot="hover-card"
          className={cn(
            'flex w-(--rx-hover-card-width) max-w-(--available-width) flex-col gap-3 p-4',
            popoverSurface,
            popupMotion,
            className,
          )}
          {...props}
        >
          {children}
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  );
}
