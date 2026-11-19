'use client';

import { Separator } from '@rectio/ui';

export default function SeparatorDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <p className="text-sm">Sign in with your company account</p>
      <Separator label="or" />
      <p className="text-sm">Use an email link</p>
      <div className="flex h-5 items-center gap-3 text-sm text-fg-muted">
        <span>Draft</span>
        <Separator orientation="vertical" />
        <span>EUR</span>
        <Separator orientation="vertical" />
        <span>March</span>
      </div>
    </div>
  );
}
