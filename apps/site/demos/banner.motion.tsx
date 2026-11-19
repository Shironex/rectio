'use client';

import { Banner } from '@rectio/motion';
import { Button } from '@rectio/ui';
import { useState } from 'react';

export default function BannerMotionDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <div className="w-full overflow-hidden rounded-panel border border-line">
        <Banner
          dismissible
          open={open}
          onDismiss={() => {
            setOpen(false);
          }}
        >
          Bulk approvals are here: approve up to 50 expenses in one go.
        </Banner>
      </div>
      {!open && (
        <Button
          variant="secondary"
          size="sm"
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
