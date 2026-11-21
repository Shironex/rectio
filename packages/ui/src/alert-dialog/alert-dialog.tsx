'use client';

import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { WarningCircleIcon, WarningIcon } from '@phosphor-icons/react';
import {
  createContext,
  use,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { Button, type ButtonProps } from '../button/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogTitleProps,
} from '../dialog/dialog';
import { cn } from '../lib/cn';

/**
 * `danger`: the action destroys or cannot be undone, such as deleting an invoice. `warning`: it can
 * be undone but costs something, such as voiding a payment run. `neutral`: a plain confirmation.
 */
export type AlertDialogTone = 'danger' | 'warning' | 'neutral';

interface AlertDialogState {
  close: () => void;
  /** The safe action, which takes the focus when the dialog opens. */
  cancel: RefObject<HTMLButtonElement | null>;
  /** The action's request is running: the dialog holds until it settles. */
  running: boolean;
  setRunning: (running: boolean) => void;
}

const StateContext = createContext<AlertDialogState | null>(null);
const ToneContext = createContext<AlertDialogTone>('danger');

function useAlertDialog(part: string): AlertDialogState {
  const state = use(StateContext);
  if (state === null) throw new Error(`${part} must be used inside an AlertDialog`);
  return state;
}

export type AlertDialogProps = BaseAlertDialog.Root.Props;

/**
 * A modal question that needs an answer before the work goes on: "Delete invoice 2041?". Unlike a
 * dialog it does not close on a press outside, and it opens with the focus on the safe action, so
 * a stray Enter keeps the data. Escape still cancels.
 */
export function AlertDialog({ actionsRef, onOpenChange, ...props }: AlertDialogProps) {
  const own = useRef<BaseAlertDialog.Root.Actions | null>(null);
  const actions = actionsRef ?? own;
  const cancel = useRef<HTMLButtonElement | null>(null);
  const [running, setRunningState] = useState(false);
  // Read when the action closes the dialog in the same tick as it stops running.
  const runningNow = useRef(false);
  const state = useMemo<AlertDialogState>(
    () => ({
      cancel,
      running,
      setRunning: (next) => {
        runningNow.current = next;
        setRunningState(next);
      },
      // Through Base UI, so onOpenChange hears it like any other close.
      close: () => actions.current?.close(),
    }),
    [actions, running],
  );
  return (
    <StateContext value={state}>
      <BaseAlertDialog.Root
        actionsRef={actions}
        onOpenChange={(open, details) => {
          // Escape cannot walk away from a request that is still running: its result lands here.
          if (!open && runningNow.current) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
        {...props}
      />
    </StateContext>
  );
}

export const AlertDialogTrigger = BaseAlertDialog.Trigger;

const ICONS: Record<Exclude<AlertDialogTone, 'neutral'>, ReactNode> = {
  danger: <WarningCircleIcon aria-hidden weight="bold" className="size-5" />,
  warning: <WarningIcon aria-hidden weight="bold" className="size-5" />,
};

const ICON_TILES: Record<Exclude<AlertDialogTone, 'neutral'>, string> = {
  danger: 'bg-negative-subtle text-negative-strong',
  warning: 'bg-warning-subtle text-warning-strong',
};

export type AlertDialogContentProps = Omit<DialogContentProps, 'showClose' | 'closeLabel'> & {
  /** Sets the icon beside the title and the look of AlertDialogAction. Default `danger`. */
  tone?: AlertDialogTone;
};

/**
 * Backdrop and popup, narrower than a dialog and without a close button: the footer's answers are
 * the only ways out, with Escape. Holds an AlertDialogHeader and an AlertDialogFooter.
 */
export function AlertDialogContent({
  tone = 'danger',
  className,
  ...props
}: AlertDialogContentProps) {
  const { cancel } = useAlertDialog('AlertDialogContent');
  return (
    <ToneContext value={tone}>
      <DialogContent
        data-slot="alert-dialog"
        data-tone={tone}
        showClose={false}
        // The safe action takes the focus; without one, the first focusable element does.
        initialFocus={() => cancel.current ?? true}
        className={cn('max-w-(--rx-alert-dialog-width)', className)}
        {...props}
      />
    </ToneContext>
  );
}

/** The tone's icon beside the title and the description; above them on a phone. */
export function AlertDialogHeader({ className, children, ...props }: ComponentProps<'div'>) {
  const tone = use(ToneContext);
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex gap-4 px-6 pt-6 pb-5 max-sm:flex-col max-sm:gap-3', className)}
      {...props}
    >
      {tone !== 'neutral' && (
        <span
          data-part="icon"
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
            ICON_TILES[tone],
          )}
        >
          {ICONS[tone]}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function AlertDialogTitle({ className, ...props }: DialogTitleProps) {
  return <DialogTitle className={cn('text-lg text-pretty', className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <DialogDescription className={cn('text-pretty', className)} {...props} />;
}

/**
 * The answers, end-aligned with the action last. On a phone they stack at full width with the safe
 * answer on top, where focus starts, so the eye does not land on the destructive one first.
 */
export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <DialogFooter
      data-slot="alert-dialog-footer"
      className={cn('max-sm:flex-col max-sm:items-stretch', className)}
      {...props}
    />
  );
}

export type AlertDialogCancelProps = Omit<ButtonProps, 'render'>;

/** The safe answer ("Keep invoice"): closes the dialog and takes the focus when it opens. */
export function AlertDialogCancel({
  variant = 'secondary',
  disabled,
  ...props
}: AlertDialogCancelProps) {
  const { cancel, running } = useAlertDialog('AlertDialogCancel');
  return (
    <BaseAlertDialog.Close
      ref={cancel}
      data-slot="alert-dialog-cancel"
      // While the action runs there is nothing left to cancel; the result decides.
      render={<Button variant={variant} disabled={disabled === true || running} {...props} />}
    />
  );
}

export type AlertDialogActionProps = Omit<ButtonProps, 'onClick'> & {
  /**
   * Runs the action. When it returns a promise the button shows its loading state and the dialog
   * stays open until the promise settles: it closes when it resolves and stays open when it
   * rejects, so the app can show what went wrong.
   */
  onAction?: (event: MouseEvent<HTMLButtonElement>) => unknown;
  /** Close the dialog once the action is done. Default true. */
  closeOnAction?: boolean;
};

/** The answer that does the work ("Delete invoice"), drawn by the content's tone. */
export function AlertDialogAction({
  onAction,
  closeOnAction = true,
  variant,
  loading,
  ...props
}: AlertDialogActionProps) {
  const { close, running, setRunning } = useAlertDialog('AlertDialogAction');
  const tone = use(ToneContext);
  return (
    <Button
      data-slot="alert-dialog-action"
      variant={variant ?? (tone === 'danger' ? 'danger' : 'primary')}
      loading={loading ?? running}
      onClick={(event) => {
        const result = onAction?.(event);
        if (!(result instanceof Promise)) {
          if (closeOnAction) close();
          return;
        }
        setRunning(true);
        result.then(
          () => {
            setRunning(false);
            if (closeOnAction) close();
          },
          () => {
            setRunning(false);
          },
        );
      }}
      {...props}
    />
  );
}
