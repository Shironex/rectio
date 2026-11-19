'use client';

import { LanguageSwitcher, VersionSwitcher } from '@rectio/blocks/docs';

export default function DocsSwitchersDemo() {
  return (
    <div className="flex items-center gap-3">
      <VersionSwitcher
        current="2.x"
        versions={[
          { value: '2.x', label: 'v2.4', href: '/', note: 'Latest' },
          { value: '1.x', label: 'v1.9', href: '/v1', note: 'Legacy' },
        ]}
      />
      <LanguageSwitcher
        current="en"
        languages={[
          { value: 'en', label: 'English', href: '/' },
          { value: 'de', label: 'Deutsch', href: '/de' },
          { value: 'pl', label: 'Polski', href: '/pl' },
        ]}
      />
    </div>
  );
}
