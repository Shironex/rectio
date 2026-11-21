'use client';

import { TrashIcon } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@rectio/ui';
import { useState } from 'react';

/** Deleting a draft invoice: the dialog waits for the request and closes when it is done. */
export default function AlertDialogDemo() {
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="danger" disabled={deleted} />}>
          <TrashIcon aria-hidden weight="bold" className="size-4" />
          Delete draft
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft invoice 2041?</AlertDialogTitle>
            <AlertDialogDescription>
              The draft for Nordlicht GmbH and its three lines are removed. Sent invoices are not
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep draft</AlertDialogCancel>
            <AlertDialogAction
              onAction={() =>
                new Promise<void>((done) => {
                  setTimeout(() => {
                    setDeleted(true);
                    done();
                  }, 900);
                })
              }
            >
              Delete draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {deleted && <p className="text-sm text-fg-muted">Draft 2041 deleted.</p>}
    </div>
  );
}
