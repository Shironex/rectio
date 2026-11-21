'use client';

import { Button, Markdown, Reasoning, type ReasoningStatus } from '@rectio/ui';
import { useState } from 'react';

/** Open while the model thinks, folded to how long it took once done. */
export default function ReasoningDemo() {
  const [status, setStatus] = useState<ReasoningStatus>('thinking');
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Reasoning status={status} duration={6}>
        <Markdown size="sm" streaming={status === 'thinking'}>
          {
            'Receivables question: find unpaid invoices past their due date, then check who **pays late** before saying whom to chase.'
          }
        </Markdown>
      </Reasoning>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => {
          setStatus((now) => (now === 'thinking' ? 'done' : 'thinking'));
        }}
      >
        {status === 'thinking' ? 'Finish thinking' : 'Think again'}
      </Button>
    </div>
  );
}
