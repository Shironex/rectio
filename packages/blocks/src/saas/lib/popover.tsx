import {
  cn,
  Popover as SharedPopover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@rectio/ui';
import type { ReactElement, ReactNode } from 'react';

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
 * A panel anchored to its trigger, such as a notifications list under a bell, on the shared
 * Popover. It traps no focus but moves it inside on open; Escape or a click outside closes it and
 * focus returns to the trigger. The blocks lay out their own padding, so the panel has none.
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
  return (
    <SharedPopover
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined
        ? {}
        : {
            onOpenChange: (next: boolean) => {
              onOpenChange(next);
            },
          })}
    >
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align={align}
        className={cn(
          'max-h-(--available-height) min-w-0 gap-0 overflow-hidden p-0 outline-none',
          className,
        )}
      >
        <PopoverTitle className={cn(!showTitle && 'sr-only')}>{title}</PopoverTitle>
        {children}
      </PopoverContent>
    </SharedPopover>
  );
}
