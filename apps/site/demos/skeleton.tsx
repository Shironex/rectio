'use client';

import { SkeletonCard, SkeletonChart, SkeletonListItem, SkeletonText } from '@rectio/ui';

export default function SkeletonDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
      <SkeletonCard />
      <div className="flex flex-col gap-6">
        <SkeletonText heading lines={3} />
        <SkeletonListItem count={2} />
      </div>
      <SkeletonChart className="sm:col-span-2" />
    </div>
  );
}
