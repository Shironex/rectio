'use client';

import { Newsletter } from '@rectio/blocks/marketing';

export default function NewsletterDemo() {
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
