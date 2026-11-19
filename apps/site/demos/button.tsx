'use client';

import { CheckIcon } from '@phosphor-icons/react';
import { Button } from '@rectio/ui';
import { useState } from 'react';

export default function ButtonDemo() {
  const [approving, setApproving] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        loading={approving}
        onClick={() => {
          setApproving(true);
          setTimeout(() => {
            setApproving(false);
          }, 1400);
        }}
      >
        <CheckIcon aria-hidden weight="bold" className="size-3.5" />
        Approve report
      </Button>
      <Button variant="secondary">Request changes</Button>
      <Button variant="ghost">Save draft</Button>
      <Button variant="danger">Reject</Button>
    </div>
  );
}
