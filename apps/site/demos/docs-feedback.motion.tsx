'use client';

import { DocsFeedback } from '@rectio/blocks/docs/motion';

export default function DocsFeedbackDemoMotion() {
  return (
    <div className="w-full max-w-lg">
      <DocsFeedback onSubmit={() => Promise.resolve()} />
    </div>
  );
}
