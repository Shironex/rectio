'use client';

import { AiChatThread } from '@rectio/blocks/ai/motion';

import { SUGGESTIONS, useDemoChat } from './chat-data';

export default function AiChatThreadMotionDemo() {
  const chat = useDemoChat();
  return (
    <div className="flex h-160 w-full overflow-hidden rounded-panel border border-line">
      <AiChatThread
        {...chat}
        className="w-full"
        suggestions={SUGGESTIONS}
        messages={{ assistant: 'Ledger assistant' }}
        composer={{ placeholder: 'Ask about invoices, cash or the close' }}
      />
    </div>
  );
}
