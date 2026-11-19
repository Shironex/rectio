import { Popover as BasePopover } from '@base-ui/react/popover';
import { cn, usePortalContainer } from '@rectio/ui';
import type { ReactElement, ReactNode } from 'react';

import { popupMotion, popupSurface } from './styles';

export interface PopoverProps {
  /** The element that opens it, usually a button; it receives the trigger's props. */
  trigger: ReactElement<Record<string, unknown>>;
  /** Names the popup for assistive technology. */
  title: string;
  /** Show the title as the popup's heading, or keep it for screen readers only. */
  showTitle?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
  children: ReactNode;
}

/**
 * A panel anchored to its trigger, such as a notifications list under a bell. It traps no focus
 * but moves it inside on open; Escape or a click outside closes it and focus returns to the
 * trigger. The block-local piece stands in for a shared Popover component.
 */
export function Popover({
  trigger,
  title,
  showTitle = false,
  open,
  onOpenChange,
  align = 'end',
  className,
  children,
}: PopoverProps) {
  const container = usePortalContainer();
  return (
    <BasePopover.Root
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined
        ? {}
        : {
            onOpenChange: (next: boolean) => {
              onOpenChange(next);
            },
          })}
    >
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal container={container}>
        <BasePopover.Positioner
          sideOffset={8}
          align={align}
          collisionPadding={12}
          className="z-50 outline-none"
        >
          <BasePopover.Popup
            className={cn(
              'flex max-h-(--available-height) max-w-(--available-width) flex-col overflow-hidden',
              popupSurface,
              popupMotion,
              className,
            )}
          >
            <BasePopover.Title className={cn(!showTitle && 'sr-only')}>{title}</BasePopover.Title>
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

/** Closes the popover it sits in; renders your element, such as a link-styled button. */
export function PopoverClose({ render }: { render: ReactElement<Record<string, unknown>> }) {
  return <BasePopover.Close render={render} />;
}
