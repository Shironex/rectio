'use client';

import { Newsletter } from '@rectio/blocks/marketing/motion';

export default function NewsletterMotionDemo() {
  return (
    <div className="w-full">
      <Newsletter
        title="The month-end letter"
        description="One short email a month on closing the books faster."
        note="No spam. Leave with one press."
        onSubscribe={async () => {
          await Promise.resolve();
        }}
      />
    </div>
  );
}
