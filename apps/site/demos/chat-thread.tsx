'use client';

import {
  ChatAnnouncer,
  ChatMessage,
  ChatThread,
  Markdown,
  PromptInput,
  StreamingText,
} from '@rectio/ui';

import { HISTORY, useDemoChat } from './chat-data';

/** The thread follows the reply while it streams; scroll up and Jump to latest appears. */
export default function ChatThreadDemo() {
  const chat = useDemoChat(
    HISTORY.map((turn) => ({ ...turn, tools: undefined, reasoning: undefined })),
  );
  const last = chat.conversation.findLast((turn) => turn.role === 'assistant');
  return (
    <div className="flex h-128 w-full overflow-hidden rounded-panel border border-line">
      <ChatThread
        className="w-full"
        contentClassName="max-w-2xl"
        footer={
          <div className="mx-auto w-full max-w-2xl px-4 pb-4">
            <PromptInput status={chat.status} onSubmit={chat.onSend} onStop={chat.onStop} />
          </div>
        }
      >
        {chat.conversation.map((turn) =>
          turn.role === 'user' ? (
            <ChatMessage key={turn.id} from="user">
              {turn.content}
            </ChatMessage>
          ) : (
            <ChatMessage key={turn.id} from="assistant" status={turn.status}>
              <StreamingText text={turn.content} streaming={turn.status === 'streaming'}>
                {(text, streaming) => <Markdown streaming={streaming}>{text}</Markdown>}
              </StreamingText>
            </ChatMessage>
          ),
        )}
      </ChatThread>
      <ChatAnnouncer
        id={last?.id}
        text={last?.content ?? ''}
        status={last?.status === 'streaming' ? 'streaming' : 'done'}
      />
    </div>
  );
}
