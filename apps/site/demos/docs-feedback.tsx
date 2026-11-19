'use client';

import { DocsFeedback } from '@rectio/blocks/docs';

export default function DocsFeedbackDemo() {
  return (
    <div className="w-full max-w-lg">
      <DocsFeedback onSubmit={() => Promise.resolve()} />
    </div>
  );
}
