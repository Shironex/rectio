'use client';

import { ChatMessage, Markdown } from '@rectio/ui';

/** A question, the reply, a failed message with Retry and a system note. */
export default function ChatMessageDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <ChatMessage from="system">Model changed to the faster one for this chat</ChatMessage>
      <ChatMessage from="user" timestamp={new Date(2026, 10, 21, 15, 12)} locale="en-US">
        Did the October close finish?
      </ChatMessage>
      <ChatMessage
        from="assistant"
        author="Ledger assistant"
        timestamp={new Date(2026, 10, 21, 15, 12)}
        locale="en-US"
      >
        <Markdown>
          {'Yes. October closed on November 6. The only adjustment was a **$240.00** accrual.'}
        </Markdown>
      </ChatMessage>
      <ChatMessage
        from="user"
        status="error"
        error="You are offline. The message will not send until you reconnect."
        onRetry={() => undefined}
      >
        Draft a reminder to Northwind.
      </ChatMessage>
    </div>
  );
}
