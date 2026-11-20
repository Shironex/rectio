'use client';

import { Changelog } from '@rectio/blocks/motion';
import { useState } from 'react';

import { RELEASES } from '@/data/account';
import { LOCALE, at } from '@/data/workspace';
import { PageHeader } from '../page-header';

/** Lindwell's release notes, with what came out since the last visit marked. */
export function WhatsNewPage() {
  const [lastSeen, setLastSeen] = useState(at(10, 20));
  return (
    <>
      <PageHeader title="What’s new" description="Changes to Lindwell, newest first" />
      <Changelog
        title="Release notes"
        releases={RELEASES}
        lastSeen={lastSeen}
        onMarkSeen={() => {
          setLastSeen(new Date());
        }}
        locale={LOCALE}
      />
    </>
  );
}
