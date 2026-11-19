'use client';

import { ContactSection, Faq } from '@rectio/blocks/marketing/motion';

import { PageIntro } from '@/components/page-intro';
import { CHANNELS, CONTACT_TOPICS } from '@/data/company';
import { FAQ } from '@/data/marketing';
import { sendContact } from '@/lib/forms';

export function ContactPage() {
  return (
    <>
      <PageIntro
        title="Talk to the team"
        description="Book a demo, ask about plans or get help moving from another tool. We reply within one working day."
      />
      <ContactSection
        title="Send us a message"
        description="Tell us about your team and what you need. Fields marked as required help us answer in one reply."
        channels={CHANNELS}
        topics={CONTACT_TOPICS}
        consentLabel="I agree that Rostra may contact me about this request."
        onSubmit={sendContact}
        className="pt-0 sm:pt-0"
      />
      <Faq title="Before you write" items={FAQ.slice(0, 3)} defaultOpen={['f1']} />
    </>
  );
}
