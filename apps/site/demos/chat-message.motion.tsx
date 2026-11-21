'use client';

import { ChatMessage, ChatThread } from '@rectio/motion/chat';
import { Button, Markdown } from '@rectio/ui';
import { useState } from 'react';

/** Messages a thread opens with stay still; the ones added afterwards rise into place. */
export default function ChatMessageMotionDemo() {
  const [replies, setReplies] = useState(0);
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex h-96 overflow-hidden rounded-panel border border-line">
        <ChatThread className="w-full">
          <ChatMessage from="user">Did the October close finish?</ChatMessage>
          {Array.from({ length: replies }, (_, index) => (
            <ChatMessage key={index} from="assistant" author="Ledger assistant">
              <Markdown>
                {'Yes. October closed on November 6 with every account reconciled.'}
              </Markdown>
            </ChatMessage>
          ))}
        </ChatThread>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => {
          setReplies((count) => count + 1);
        }}
      >
        Add a reply
      </Button>
    </div>
  );
}
