'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { XIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export type DialogContentProps = WithClassName<ComponentProps<typeof BaseDialog.Popup>> & {
  /** Label of the corner close button. Hide it with `showClose={false}` if the footer has one. */
  closeLabel?: string;
  showClose?: boolean;
  children: ReactNode;
};

/**
 * Backdrop, viewport and popup in one. Focus moves into the popup, is trapped there, and returns to
 * the trigger on close; Escape and a backdrop press close it. Portals into the nearest ThemeScope.
 */
export function DialogContent({
  className,
  children,
  closeLabel = 'Close',
  showClose = true,
  ...props
}: DialogContentProps) {
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal container={container}>
      <BaseDialog.Backdrop
        className={cn(
          'fixed inset-0 z-50 bg-scrim',
          'transition-opacity duration-base ease-standard',
          'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-fast',
        )}
      />
      {/* Anchored near the top, so the dialog grows downward when errors appear instead of re-centring
          under the pointer. */}
      <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-24">
        <BaseDialog.Popup
          data-slot="dialog"
          className={cn(
            'relative flex w-full max-w-(--rx-dialog-width) flex-col',
            'rounded-(--rx-dialog-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-dialog-shadow) backdrop-surface',
            'outline-none',
            'transition-[opacity,scale,translate] duration-slow ease-enter',
            'data-starting-style:translate-y-(--rx-motion-distance-shift) data-starting-style:scale-(--rx-motion-scale-from) data-starting-style:opacity-0',
            'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
            className,
          )}
          {...props}
        >
          {children}
          {showClose && (
            <BaseDialog.Close
              aria-label={closeLabel}
              className={cn(
                'absolute end-3 top-3 inline-flex size-(--rx-button-height-sm) cursor-pointer items-center justify-center',
                'rounded-(--rx-button-radius) text-fg-subtle hover:bg-surface-hover hover:text-fg',
                'transition-colors duration-fast ease-standard',
                'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                touchHitArea,
              )}
            >
              <XIcon aria-hidden weight="bold" className="size-4" />
            </BaseDialog.Close>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 px-6 pt-5 pe-14', className)} {...props} />;
}

export type DialogTitleProps = WithClassName<ComponentProps<typeof BaseDialog.Title>>;

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      className={cn('font-display text-xl font-heading tracking-tight text-fg', className)}
      {...props}
    />
  );
}

export type DialogDescriptionProps = WithClassName<ComponentProps<typeof BaseDialog.Description>>;

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <BaseDialog.Description className={cn('text-sm text-fg-muted', className)} {...props} />;
}

export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-4 px-6 py-5', className)} {...props} />;
}

/** Actions, end-aligned. The primary action goes last. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-line bg-(--rx-dialog-footer-background) px-6 py-3',
        'rounded-b-(--rx-dialog-radius)',
        className,
      )}
      {...props}
    />
  );
}
