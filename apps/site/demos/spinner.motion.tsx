'use client';

import { LoadingOverlay } from '@rectio/motion';
import { Button } from '@rectio/ui';
import { useState } from 'react';

export default function SpinnerMotionDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-panel border border-line">
      <div className="flex flex-col gap-3 p-5 text-sm">
        <span className="font-medium">Exchange rates</span>
        <span className="text-fg-muted numeric">EUR to GBP 0.8412</span>
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => {
            setBusy((b) => !b);
          }}
        >
          {busy ? 'Finish' : 'Refresh'}
        </Button>
      </div>
      <LoadingOverlay visible={busy} label="Refreshing rates" className="pointer-events-none" />
    </div>
  );
}
