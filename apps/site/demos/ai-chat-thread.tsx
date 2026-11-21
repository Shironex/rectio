'use client';

import { AiChatThread } from '@rectio/blocks/ai';

import { SUGGESTIONS, useDemoChat } from './chat-data';

/** A whole conversation fed by a fake stream: pick a suggestion or ask anything. */
export default function AiChatThreadDemo() {
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
