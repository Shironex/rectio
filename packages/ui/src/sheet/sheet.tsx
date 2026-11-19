import { Drawer } from '@base-ui/react/drawer';
import { XIcon } from '@phosphor-icons/react';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** The edge the sheet slides from. `bottom` is the phone bottom sheet. */
export type SheetSide = 'left' | 'right' | 'top' | 'bottom';

const SWIPE: Record<SheetSide, 'left' | 'right' | 'up' | 'down'> = {
  left: 'left',
  right: 'right',
  top: 'up',
  bottom: 'down',
};

const SideContext = createContext<SheetSide>('right');

export type SheetProps<Payload = unknown> = Omit<Drawer.Root.Props<Payload>, 'swipeDirection'> & {
  /** Default `right`. The sheet can be swiped back toward this edge to close it. */
  side?: SheetSide;
};

/**
 * A panel that slides in from an edge for a side task: a record's details, filters, a phone menu.
 * Modal like a dialog (focus trapped and restored, Escape and the backdrop close it), and it can
 * be swiped back toward its edge on a touch screen.
 */
export function Sheet<Payload>({ side = 'right', ...props }: SheetProps<Payload>) {
  return (
    <SideContext value={side}>
      <Drawer.Root swipeDirection={SWIPE[side]} {...props} />
    </SideContext>
  );
}

export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;

const popupBySide: Record<SheetSide, string> = {
  right: cn(
    'inset-y-0 end-0 h-full w-(--rx-sheet-width) max-w-5/6 border-s',
    'translate-x-(--drawer-swipe-movement-x)',
    'data-starting-style:translate-x-full data-ending-style:translate-x-full',
    'rtl:data-starting-style:-translate-x-full rtl:data-ending-style:-translate-x-full',
  ),
  left: cn(
    'inset-y-0 start-0 h-full w-(--rx-sheet-width) max-w-5/6 border-e',
    'translate-x-(--drawer-swipe-movement-x)',
    'data-starting-style:-translate-x-full data-ending-style:-translate-x-full',
    'rtl:data-starting-style:translate-x-full rtl:data-ending-style:translate-x-full',
  ),
  top: cn(
    'inset-x-0 top-0 max-h-5/6 rounded-b-(--rx-sheet-radius) border-b',
    'translate-y-(--drawer-swipe-movement-y)',
    'data-starting-style:-translate-y-full data-ending-style:-translate-y-full',
  ),
  bottom: cn(
    'inset-x-0 bottom-0 max-h-5/6 rounded-t-(--rx-sheet-radius) border-t',
    'translate-y-(--drawer-swipe-movement-y)',
    'data-starting-style:translate-y-full data-ending-style:translate-y-full',
  ),
};

export type SheetContentProps = WithClassName<ComponentProps<typeof Drawer.Popup>> & {
  /** Label of the corner close button. Hide it with `showClose={false}` if the footer has one. */
  closeLabel?: string;
  showClose?: boolean;
  children: ReactNode;
};

/** Backdrop, viewport and panel in one. Portals into the nearest ThemeScope. */
export function SheetContent({
  className,
  children,
  closeLabel = 'Close',
  showClose = true,
  ...props
}: SheetContentProps) {
  const side = use(SideContext);
  const container = usePortalContainer();
  const vertical = side === 'top' || side === 'bottom';
  return (
    <Drawer.Portal container={container}>
      <Drawer.Backdrop
        className={cn(
          'fixed inset-0 z-50 bg-scrim',
          'transition-opacity duration-base ease-enter data-swiping:transition-none',
          'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
        )}
      />
      <Drawer.Viewport className="fixed inset-0 z-50">
        <Drawer.Popup
          data-slot="sheet"
          data-side={side}
          className={cn(
            'fixed flex flex-col overflow-hidden border-line bg-surface-overlay text-fg shadow-(--rx-sheet-shadow) outline-none',
            'transition-[translate,opacity] duration-base ease-enter will-change-transform',
            // Under reduced motion the sheet fades in place instead of travelling across the screen.
            'motion-reduce:data-starting-style:translate-0 motion-reduce:data-ending-style:translate-0',
            'motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0',
            'data-swiping:transition-none data-swiping:select-none',
            'data-ending-style:duration-fast data-ending-style:ease-exit',
            popupBySide[side],
            className,
          )}
          {...props}
        >
          {side === 'bottom' && (
            // A handle says the sheet can be dragged down. Decorative: Escape and the button close it.
            <div
              aria-hidden
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong"
            />
          )}
          <Drawer.Content
            className={cn('flex min-h-0 flex-1 flex-col', vertical && 'overflow-y-auto')}
            // Clears the home indicator on phones without a design value: the inset comes from the device.
            style={side === 'bottom' ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
          >
            {children}
          </Drawer.Content>
          {showClose && (
            <Drawer.Close
              aria-label={closeLabel}
              className={cn(
                'absolute end-3 top-3 inline-flex size-(--rx-button-height-sm) cursor-pointer items-center justify-center',
                'rounded-(--rx-button-radius) text-fg-subtle hover:bg-surface-hover hover:text-fg',
                'transition-colors duration-fast ease-standard',
                'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                side === 'bottom' && 'top-4',
                touchHitArea,
              )}
            >
              <XIcon aria-hidden weight="bold" className="size-4" />
            </Drawer.Close>
          )}
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex shrink-0 flex-col gap-1 px-5 pt-5 pb-3 pe-14', className)}
      {...props}
    />
  );
}

export type SheetTitleProps = WithClassName<ComponentProps<typeof Drawer.Title>>;

export function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <Drawer.Title
      className={cn('font-display text-xl font-heading tracking-tight text-fg', className)}
      {...props}
    />
  );
}

export type SheetDescriptionProps = WithClassName<ComponentProps<typeof Drawer.Description>>;

export function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return <Drawer.Description className={cn('text-sm text-fg-muted', className)} {...props} />;
}

/** The scrolling middle. */
export function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-3', className)}
      {...props}
    />
  );
}

/** Actions, end-aligned and pinned to the bottom. The primary action goes last. */
export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-(--rx-dialog-footer-background) px-5 py-3',
        className,
      )}
      {...props}
    />
  );
}
