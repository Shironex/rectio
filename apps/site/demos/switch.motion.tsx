'use client';

import { SwitchField } from '@rectio/motion';

/** Workspace settings that apply the moment they change. */
export default function SwitchMotionDemo() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-line">
      <SwitchField
        fieldClassName="py-3 first:pt-0"
        label="Email receipts"
        description="Send a copy of every approved expense to its owner."
        defaultChecked
      />
      <SwitchField
        fieldClassName="py-3"
        label="Require two approvers"
        description="For expenses above €5,000."
      />
      <SwitchField
        fieldClassName="py-3 last:pb-0"
        label="Single sign-on only"
        description="Available on the Scale plan."
        disabled
      />
    </div>
  );
}
