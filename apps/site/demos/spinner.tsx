'use client';

import { Button, LoadingOverlay, Spinner, useLoadingAction } from '@rectio/ui';
import { useState } from 'react';

export default function SpinnerDemo() {
  const [busy, setBusy] = useState(false);
  const save = useLoadingAction(() => new Promise((resolve) => setTimeout(resolve, 1500)));
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8">
      <div className="flex flex-wrap items-center justify-center gap-8">
        <Spinner variant="ring" size="lg" label="Loading" />
        <Spinner variant="dots" size="lg" label="Loading" />
        <Spinner variant="bars" size="lg" label="Loading" />
        <Spinner variant="pulse" size="lg" label="Loading" />
        <Spinner variant="orbit" size="lg" label="Loading" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Spinner variant="dots" size="sm" showLabel label="Matching 214 transactions" />
        <Button loading={save.loading} onClick={() => void save.run()}>
          Save draft
        </Button>
      </div>
      <div className="relative w-full overflow-hidden rounded-panel border border-line">
        <div className="flex items-center justify-between gap-4 p-4 text-sm">
          <span>Exchange rates</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setBusy((b) => !b);
            }}
          >
            {busy ? 'Finish' : 'Refresh'}
          </Button>
        </div>
        <LoadingOverlay visible={busy} label="Refreshing rates" className="pointer-events-none" />
      </div>
    </div>
  );
}
