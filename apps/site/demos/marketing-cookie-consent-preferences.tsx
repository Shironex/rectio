'use client';

import { Button } from '@rectio/ui';
import { useState } from 'react';
import { CookiePreferences, type ConsentRecord } from '@rectio/blocks/marketing';

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

export default function CookieConsentPreferencesDemo() {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  return (
    <div className="w-full">
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Cookie settings
      </Button>
      <CookiePreferences
        open={open}
        onOpenChange={setOpen}
        categories={CATEGORIES}
        version="2026-03"
        consent={consent}
        onSave={setConsent}
        policyHref="#cookies"
      />
    </div>
  );
}
