'use client';

import { Changelog } from '@rectio/blocks/motion';
import { useState } from 'react';

import { LAST_SEEN, RELEASES } from './changelog';

export default function ChangelogMotionDemo() {
  const [lastSeen, setLastSeen] = useState(LAST_SEEN);
  return (
    <div className="w-full">
      <Changelog
        releases={RELEASES}
        lastSeen={lastSeen}
        onMarkSeen={() => {
          setLastSeen(new Date());
        }}
        locale="en-GB"
      />
    </div>
  );
}
