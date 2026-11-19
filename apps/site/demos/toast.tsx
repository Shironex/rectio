'use client';

import { Button, ToastProvider, useToast } from '@rectio/ui';
import { useState } from 'react';

/** A toast with an Undo stays long enough to reach the button from the keyboard. */
export const UNDO_MS = 8000;

export default function ToastDemo() {
  return (
    <ToastProvider timeout={UNDO_MS}>
      <ReportActions />
    </ToastProvider>
  );
}

/** The actions, shared with the motion demo: the motion add-on uses the same `useToast`. */
export function ReportActions() {
  const toast = useToast();
  const [lines, setLines] = useState(7);

  const removeLine = () => {
    setLines((n) => n - 1);
    const id = toast.add({
      type: 'success',
      title: 'Expense removed',
      description: 'Deutsche Bahn, €89.90. Total now €1,179.30.',
      actionProps: {
        children: 'Undo',
        onClick: () => {
          setLines((n) => n + 1);
          toast.close(id);
        },
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-fg-muted">Report 2041 holds {lines} expenses.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="danger" disabled={lines === 0} onClick={removeLine}>
          Remove a line
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            toast.add({
              type: 'info',
              title: 'Sent for approval',
              description: 'Report 2041 is with your manager.',
            });
          }}
        >
          Submit report
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            toast.add({
              type: 'error',
              title: 'Bank feed did not sync',
              description: 'The bank did not answer. Try again in a few minutes.',
            });
          }}
        >
          Sync bank feed
        </Button>
      </div>
    </div>
  );
}
