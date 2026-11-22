'use client';

import { ChatMessage, ChatThread, StreamingText } from '@rectio/motion/chat';
import { ChatAnnouncer, Markdown, PromptInput } from '@rectio/ui';

import { CITATIONS, HISTORY, useDemoChat } from './chat-data';

/** New messages rise in and the reply reveals at an even pace on whole words. */
export default function ChatThreadMotionDemo() {
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
                {(text, streaming) => (
                  <Markdown streaming={streaming} components={CITATIONS}>
                    {text}
                  </Markdown>
                )}
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
