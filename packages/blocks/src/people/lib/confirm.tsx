'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Textarea,
  type AlertDialogTone,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

/** What the dialog asks: open while `request` is set, closed when it is null. */
export interface ConfirmRequest {
  title: string;
  description: ReactNode;
  confirm: string;
  cancel: string;
  tone?: AlertDialogTone | undefined;
  /** Asks for a reason in a field; the action waits until it is written when `required`. */
  reason?: { label: string; required?: boolean | undefined; missing: string } | undefined;
  onConfirm: (reason: string) => void;
}

/**
 * The people blocks' confirm step: an alert dialog with a safe answer that takes the focus, and an
 * optional reason field (declining leave, sending a week back) that must be filled before the
 * action runs. Keeps nothing of its own once it closes.
 */
export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  // The last request stays drawn while the dialog animates out.
  const [shown, setShown] = useState(request);
  if (request !== null && request !== shown) {
    setShown(request);
    setReason('');
    setTried(false);
  }
  const current = request ?? shown;
  const missing = current?.reason?.required === true && reason.trim() === '';
  return (
    <AlertDialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent tone={current?.tone ?? 'neutral'}>
        <AlertDialogHeader>
          <AlertDialogTitle>{current?.title}</AlertDialogTitle>
          <AlertDialogDescription>{current?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {current?.reason !== undefined && (
          <div className="px-6 pb-5">
            <Field invalid={tried && missing}>
              <FieldLabel>{current.reason.label}</FieldLabel>
              <Textarea
                value={reason}
                onValueChange={setReason}
                minRows={2}
                maxRows={6}
                aria-required={current.reason.required === true || undefined}
              />
              {tried && missing && <FieldError match>{current.reason.missing}</FieldError>}
            </Field>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{current?.cancel}</AlertDialogCancel>
          <AlertDialogAction
            closeOnAction={false}
            onAction={() => {
              if (current === null) return;
              if (missing) {
                setTried(true);
                return;
              }
              current.onConfirm(reason.trim());
              onClose();
            }}
          >
            {current?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
