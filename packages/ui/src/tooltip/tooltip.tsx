'use client';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ComponentProps, ReactNode } from 'react';

import { KbdShortcut } from '../kbd/kbd';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type TooltipProviderProps = ComponentProps<typeof BaseTooltip.Provider>;

/**
 * Groups the tooltips below it: the first waits `delay` (600ms) so a passing pointer opens
 * nothing, then a neighbour opens at once, without its entrance, while the pointer moves along a
 * toolbar within `timeout` (400ms). Put one near the root of the app.
 */
export function TooltipProvider({ delay = 600, timeout = 400, ...props }: TooltipProviderProps) {
  return <BaseTooltip.Provider delay={delay} timeout={timeout} {...props} />;
}

export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export type TooltipContentProps = WithClassName<ComponentProps<typeof BaseTooltip.Popup>> & {
  side?: ComponentProps<typeof BaseTooltip.Positioner>['side'];
  align?: ComponentProps<typeof BaseTooltip.Positioner>['align'];
  sideOffset?: number;
  /** A shortcut for the action, such as `mod+b`, drawn as keycaps after the label. */
  shortcut?: string;
  children: ReactNode;
};

/**
 * A short label for a control whose purpose is not written on it, such as an icon button. Never
 * the only place important information lives: tooltips do not open on touch screens.
 */
export function TooltipContent({
  className,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  shortcut,
  ...props
}: TooltipContentProps) {
  const container = usePortalContainer();
  return (
    <BaseTooltip.Portal container={container}>
      <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset} className="z-50">
        <BaseTooltip.Popup
          data-slot="tooltip"
          className={cn(
            'flex max-w-64 items-center gap-2 rounded-(--rx-tooltip-radius) px-2 py-1',
            'bg-fg text-sm text-surface',
            'origin-(--transform-origin) transition-[opacity,scale] duration-fast ease-enter',
            'data-starting-style:scale-(--rx-motion-scale-from) data-starting-style:opacity-0',
            'data-ending-style:opacity-0 data-ending-style:ease-exit',
            // Opened within the group's timeout: no entrance, so moving along a toolbar feels instant.
            'data-instant:transition-none',
            className,
          )}
          {...props}
        >
          {children}
          {shortcut !== undefined && (
            <KbdShortcut
              shortcut={shortcut}
              className="-me-1"
              keyClassName="border-surface/25 bg-surface/10 text-surface"
            />
          )}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
