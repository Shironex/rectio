'use client';

import { ChatLoader } from '@rectio/motion/chat';
import { Button } from '@rectio/ui';
import { useState } from 'react';

/** The typing dots fade up into the reply's place. */
export default function ChatLoaderMotionDemo() {
  const [key, setKey] = useState(0);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ChatLoader key={key} />
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => {
          setKey((k) => k + 1);
        }}
      >
        Replay
      </Button>
    </div>
  );
}
