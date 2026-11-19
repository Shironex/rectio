'use client';

import { useState } from 'react';
import { CookieConsent, type ConsentRecord } from '@rectio/blocks/marketing/motion';

const CATEGORIES = [
  {
    id: 'necessary',
    title: 'Necessary',
    description: 'Keeps you signed in and the site working.',
    required: true,
  },
  { id: 'analytics', title: 'Analytics', description: 'Counts visits so we can improve.' },
  { id: 'marketing', title: 'Marketing', description: 'Measures which campaigns work.' },
];

export default function CookieConsentBannerMotionDemo() {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  return (
    <div className="relative h-96 w-full transform-gpu">
      <CookieConsent
        categories={CATEGORIES}
        version="2026-03"
        consent={consent}
        onSave={setConsent}
        policyHref="#cookies"
      />
    </div>
  );
}
