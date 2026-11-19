'use client';

import { SkeletonSwap } from '@rectio/motion';
import { Avatar, Button, SkeletonListItem } from '@rectio/ui';
import { useState } from 'react';

const people = ['Ana Ruiz', 'Tomasz Nowak', 'Lena Fischer'];

export default function SkeletonMotionDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <SkeletonSwap loading={loading} fallback={<SkeletonListItem count={3} />}>
        <ul className="divide-y divide-line">
          {people.map((name) => (
            <li key={name} className="flex items-center gap-3 py-3">
              <Avatar name={name} />
              <span className="flex-1 text-sm font-medium">{name}</span>
              <span className="text-sm text-fg-muted numeric">4 open</span>
            </li>
          ))}
        </ul>
      </SkeletonSwap>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => {
          setLoading((l) => !l);
        }}
      >
        {loading ? 'Show content' : 'Load again'}
      </Button>
    </div>
  );
}
