'use client';

import { Progress } from '@rectio/ui';

export default function ProgressDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Progress value={64} label="Uploading statements" showValue description="12 of 19 files" />
      <Progress value={null} label="Preparing export" size="sm" />
      <Progress value={62.5} segments={4} label="Account setup" showValue />
    </div>
  );
}
