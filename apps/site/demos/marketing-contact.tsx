'use client';

import { ContactSection } from '@rectio/blocks/marketing';

export default function ContactSectionDemo() {
  return (
    <div className="w-full">
      <ContactSection
        title="Talk to us"
        description="Questions about plans, security or a demo? We reply within one working day."
        topics={[
          { value: 'sales', label: 'Sales' },
          { value: 'support', label: 'Support' },
        ]}
        channels={[
          {
            id: 'email',
            label: 'Email',
            value: 'hello@northlake.example',
            href: 'mailto:hello@northlake.example',
          },
          { id: 'hours', label: 'Hours', value: 'Monday to Friday, 9 to 17 CET' },
        ]}
        consentLabel="I agree to be contacted about my request."
        onSubmit={async () => {
          await Promise.resolve();
        }}
      />
    </div>
  );
}
