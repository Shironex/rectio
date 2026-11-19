import { Toast } from '@base-ui/react/toast';
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { usePortalContainer } from '../theme-scope/theme-scope';

/** The kinds a toast can be. Each carries an icon and a word in the title, never colour alone. */
export type ToastType = 'success' | 'error' | 'info';

const ICONS: Record<ToastType, { Icon: typeof InfoIcon; className: string }> = {
  success: { Icon: CheckCircleIcon, className: 'text-positive-strong' },
  error: { Icon: WarningCircleIcon, className: 'text-negative-strong' },
  info: { Icon: InfoIcon, className: 'text-info-strong' },
};

export interface ToastProviderProps {
  children: ReactNode;
  /**
   * Milliseconds before a toast closes by itself. Hovering or focusing the stack pauses it, and a
   * toast with an action should get more time (8000 or so) so the action can still be reached.
   */
  timeout?: number;
  /** Toasts shown at once; older ones wait, hidden. */
  limit?: number;
  /** Label of each toast's close button. */
  closeLabel?: string;
}

/**
 * Holds the toasts and renders them in the corner of the nearest ThemeScope. Put it once near the
 * root, inside the ThemeScope, and add toasts with `useToast().add(...)`. F6 moves focus into the
 * stack and back.
 */
export function ToastProvider({
  children,
  timeout = 6000,
  limit = 3,
  closeLabel = 'Dismiss',
}: ToastProviderProps) {
  return (
    <Toast.Provider timeout={timeout} limit={limit}>
      {children}
      <ToastViewport closeLabel={closeLabel} />
    </Toast.Provider>
  );
}

/**
 * Adds, updates and closes toasts: `add({ type: 'success', title, description, actionProps })`.
 * For an undo, pass `actionProps: { children: 'Undo', onClick }` and close the toast in onClick.
 */
export const useToast = Toast.useToastManager;

function ToastViewport({ closeLabel }: { closeLabel: string }) {
  const container = usePortalContainer();
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal container={container}>
      <Toast.Viewport
        data-slot="toast-viewport"
        className={cn(
          // Newest at the bottom, nearest the corner; older toasts move up.
          'fixed inset-x-4 bottom-4 z-50 flex flex-col-reverse gap-2 outline-none',
          'sm:start-auto sm:end-6 sm:bottom-6 sm:w-(--rx-toast-width)',
        )}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} closeLabel={closeLabel} />
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function ToastItem({ toast, closeLabel }: { toast: Toast.Root.ToastObject; closeLabel: string }) {
  const kind = ICONS[toast.type as ToastType] as (typeof ICONS)[ToastType] | undefined;
  return (
    <Toast.Root
      toast={toast}
      swipeDirection={['right', 'down']}
      data-slot="toast"
      className={cn(
        'relative flex items-start gap-3 py-3 ps-4 pe-2',
        'rounded-(--rx-toast-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-toast-shadow)',
        'select-none',
        // Enters with a short rise and a fade; reduced motion keeps only the fade (the token
        // distance is zero there). Leaves as a fade, or along the swipe.
        'translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y)',
        'transition-[opacity,translate] duration-base ease-enter',
        'data-starting-style:translate-y-(--rx-motion-distance-shift) data-starting-style:opacity-0',
        'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
        'motion-safe:data-ending-style:data-[swipe-direction=right]:translate-x-full',
        'motion-safe:data-ending-style:data-[swipe-direction=down]:translate-y-full',
        'data-swiping:transition-none',
        'data-limited:hidden',
      )}
    >
      {kind !== undefined && (
        <kind.Icon
          aria-hidden
          weight="bold"
          className={cn('mt-0.5 size-4 shrink-0', kind.className)}
        />
      )}
      <Toast.Content className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Toast.Title className="text-sm font-medium text-fg" />
        <Toast.Description className="text-sm text-fg-muted" />
      </Toast.Content>
      <div className="flex shrink-0 items-center gap-1 self-center">
        {toast.actionProps !== undefined && (
          <Toast.Action
            className={cn(
              // A bordered small button in every theme: the action must read as a control, never as
              // more text in the message.
              'inline-flex h-(--rx-button-height-sm) cursor-pointer items-center px-(--rx-button-padding-x-sm)',
              'rounded-(--rx-button-radius) border border-line-strong text-sm font-medium text-fg hover:bg-surface-hover',
              'transition-colors duration-fast ease-standard',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            )}
          />
        )}
        <Toast.Close
          aria-label={closeLabel}
          className={cn(
            'inline-flex size-(--rx-button-height-sm) cursor-pointer items-center justify-center',
            'rounded-(--rx-button-radius) text-fg-subtle hover:bg-surface-hover hover:text-fg',
            'transition-colors duration-fast ease-standard',
            'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
          )}
        >
          <XIcon aria-hidden weight="bold" className="size-3.5" />
        </Toast.Close>
      </div>
    </Toast.Root>
  );
}
