'use client';

import { useState } from 'react';
import { AnnouncementBar } from '@rectio/blocks/marketing';

export default function AnnouncementBarDemo() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="w-full">
      <AnnouncementBar
        tag="New"
        message="Close checklists are here: every task of month end in one view"
        action={{ label: 'Read the changelog', href: '#changelog' }}
        onDismiss={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}
