'use client';

import { Alert } from '@rectio/motion';
import { Button } from '@rectio/ui';
import { useState } from 'react';

export default function AlertMotionDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert
        tone="info"
        title="New: export to your accounting system"
        dismissible
        open={open}
        onDismiss={() => {
          setOpen(false);
        }}
      />
      {!open && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => {
            setOpen(true);
          }}
        >
          Show again
        </Button>
      )}
    </div>
  );
}
