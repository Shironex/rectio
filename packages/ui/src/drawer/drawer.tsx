import { useSyncExternalStore, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
  type SheetProps,
} from '../sheet/sheet';

/** Below this width the drawer is a bottom sheet: Tailwind's `sm` breakpoint. */
const PHONE_QUERY = '(width < 40rem)';

function subscribePhone(onChange: () => void) {
  if (typeof matchMedia !== 'function') return () => undefined;
  const list = matchMedia(PHONE_QUERY);
  list.addEventListener('change', onChange);
  return () => {
    list.removeEventListener('change', onChange);
  };
}

const readPhone = () => typeof matchMedia === 'function' && matchMedia(PHONE_QUERY).matches;

/** True on a phone-width screen. False on the server: the drawer renders closed there anyway. */
function usePhoneLayout(): boolean {
  return useSyncExternalStore(subscribePhone, readPhone, () => false);
}

/** Where the drawer opens on a tablet or desktop. On a phone it is always a bottom sheet. */
export type DrawerSide = 'left' | 'right' | 'bottom';

export type DrawerProps<Payload = unknown> = Omit<SheetProps<Payload>, 'side'> & {
  /** Default `right`. On a phone-width screen the drawer comes up from the bottom instead. */
  side?: DrawerSide;
};

/**
 * One panel for a side task that fits the screen it is on: a bottom sheet a thumb can reach and
 * drag down on a phone, a side panel on a wider screen. Built on Sheet, so it is modal, traps and
 * restores focus, and closes on Escape, the backdrop, the close button or a swipe toward its edge.
 * As a bottom sheet it can rest at `snapPoints`, such as a peek and full height.
 */
export function Drawer<Payload>({ side = 'right', snapPoints, ...props }: DrawerProps<Payload>) {
  const phone = usePhoneLayout();
  const resolved = phone ? 'bottom' : side;
  return (
    <Sheet
      side={resolved}
      // Snap points only mean something for a sheet that comes up from the bottom.
      {...(resolved === 'bottom' && snapPoints !== undefined ? { snapPoints } : {})}
      {...props}
    />
  );
}

export const DrawerTrigger = SheetTrigger;
export const DrawerClose = SheetClose;
export const DrawerHeader = SheetHeader;
export const DrawerTitle = SheetTitle;
export const DrawerDescription = SheetDescription;
export const DrawerBody = SheetBody;

/**
 * Actions, pinned to the bottom with the primary action last. On a phone they stack at full width,
 * the primary action on top, within reach of a thumb.
 */
export function DrawerFooter({ className, ...props }: ComponentProps<typeof SheetFooter>) {
  return (
    <SheetFooter
      className={cn('max-sm:flex-col-reverse max-sm:items-stretch', className)}
      {...props}
    />
  );
}

export type DrawerContentProps = SheetContentProps & {
  /**
   * The height of a bottom sheet. `auto` (default) fits the content up to most of the screen;
   * `full` takes most of the screen, the height to give a drawer with snap points.
   */
  height?: 'auto' | 'full';
  children: ReactNode;
};

/**
 * Backdrop and panel. As a bottom sheet it carries a drag handle; as a side panel it takes the
 * sheet widths (`size`).
 */
export function DrawerContent({ height = 'auto', className, ...props }: DrawerContentProps) {
  return (
    <SheetContent
      data-drawer=""
      className={cn(height === 'full' && 'data-[side=bottom]:h-5/6', className)}
      {...props}
    />
  );
}
