'use client';

import { Banner } from '@rectio/ui';

export default function BannerDemo() {
  return (
    <div className="flex w-full flex-col gap-3 overflow-hidden rounded-panel border border-line">
      <Banner dismissible action={<a href="#usage">See what changed</a>}>
        Bulk approvals are here: approve up to 50 expenses in one go.
      </Banner>
      <Banner tone="warning">Scheduled maintenance on Sunday, 02:00 to 03:00 CET.</Banner>
    </div>
  );
}
