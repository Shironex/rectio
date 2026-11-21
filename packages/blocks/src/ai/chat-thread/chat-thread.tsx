import {
  ChatAnnouncer,
  ChatDaySeparator,
  ChatSourceChip,
  ChatSources,
  Markdown,
  MessageActions,
  MessageCopyAction,
  MessageFeedback,
  MessageRegenerateAction,
  PromptInput,
  Reasoning,
  ToolCall,
  cn,
  markdownToText,
  type MarkdownCodeProps,
  type MarkdownComponents,
  type PromptInputProps,
} from '@rectio/ui';
import type { ReactNode } from 'react';

import { CodeBlock } from '../../docs/code-block/code-block';
import { useAiParts } from '../lib/parts';
import {
  announcedTurn,
  awaitingReply,
  chatRows,
  type AiChatStatus,
  type AiChatSuggestion,
  type AiChatTurn,
} from './chat-thread.logic';

export * from './chat-thread.logic';

/** Every word the chat thread block says, for apps that translate or reword them. */
export interface AiChatThreadMessages {
  /** Names the conversation for assistive technology. */
  label: string;
  /** The assistant's name, on its replies and in announcements. */
  assistant: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Names the group of suggestion chips. */
  suggestions: string;
  /** Names a citation whose source has not arrived yet. */
  source: (index: number) => string;
  /** Said by the typing dots before the first words of a reply. */
  typing: (assistant: string) => string;
}

export const AI_CHAT_THREAD_MESSAGES: AiChatThreadMessages = {
  label: 'Conversation',
  assistant: 'Assistant',
  emptyTitle: 'What can I help with?',
  emptyDescription: 'Ask a question, or start from one of these.',
  suggestions: 'Suggestions',
  typing: (assistant) => `${assistant} is typing`,
  source: (index) => `Source ${String(index)}`,
};

export interface AiChatThreadProps {
  /** The conversation so far, oldest first. */
  conversation: readonly AiChatTurn[];
  /** `submitting` after the reader sent, `streaming` while a reply arrives. */
  status?: AiChatStatus | undefined;
  /** Called with the reader's words; return false to keep them in the field. */
  onSend: PromptInputProps['onSubmit'];
  /** Stops the reply in progress; Send turns into Stop while one streams. */
  onStop?: (() => void) | undefined;
  /** Sends a failed turn again. */
  onRetry?: ((turn: AiChatTurn) => void) | undefined;
  /** Asks for the latest reply again. */
  onRegenerate?: ((turn: AiChatTurn) => void) | undefined;
  /** Rates a reply; a second press on the same thumb clears it. */
  onFeedback?: ((turn: AiChatTurn, value: 'good' | 'bad' | null) => void) | undefined;
  /** Starting points on the empty thread. A chip sends its prompt. */
  suggestions?: readonly AiChatSuggestion[] | undefined;
  /** Replaces the empty state's icon, title and description. */
  empty?: ReactNode;
  /** Above the conversation: a title bar, a model picker. */
  header?: ReactNode;
  /** The assistant's avatar on its replies. */
  avatar?: ReactNode;
  /** Props for the message field: attachments, limits, placeholder, tools. */
  composer?: Omit<PromptInputProps, 'onSubmit' | 'onStop' | 'status'> | undefined;
  /** Renders fenced code; the docs code block by default. */
  code?: ((props: MarkdownCodeProps) => ReactNode) | undefined;
  locale?: string | undefined;
  /** Today, for the day separators. Defaults to now. */
  now?: Date | undefined;
  messages?: Partial<AiChatThreadMessages> | undefined;
  className?: string | undefined;
}

function DefaultCode({ code, lang, meta, closed }: MarkdownCodeProps) {
  return (
    <CodeBlock
      code={code}
      lang={lang ?? undefined}
      meta={meta ?? undefined}
      // A reply column is narrow: long lines wrap instead of running under the copy button.
      wrap
      // A block still arriving has nothing worth copying yet.
      copy={closed}
    />
  );
}

/**
 * A whole conversation with an assistant: replies in safe Markdown with code blocks, reasoning and
 * tool calls folded above the answer, sources under it, actions to copy, rate and regenerate, day
 * separators, a field that sends with Enter and stops a reply, and an empty state with
 * suggestions. Provider agnostic: the conversation is a prop and every action is a callback, so
 * any streaming source feeds it. The log never speaks each chunk; one announcement says a reply
 * started and one reads it when done.
 */
export function AiChatThread({
  conversation,
  status = 'idle',
  onSend,
  onStop,
  onRetry,
  onRegenerate,
  onFeedback,
  suggestions = [],
  empty,
  header,
  avatar,
  composer,
  code = DefaultCode,
  locale,
  now,
  messages: overrides,
  className,
}: AiChatThreadProps) {
  const m = { ...AI_CHAT_THREAD_MESSAGES, ...overrides };
  const { ChatThread, ChatMessage, StreamingText, ChatLoader } = useAiParts();
  const citations = (turn: AiChatTurn): MarkdownComponents => ({
    code,
    // `[1](#source-1)` in a reply becomes the chip of its first source.
    link: (props) => {
      const match = /^#source-(\d+)$/.exec(props.href);
      if (match === null) return undefined;
      const index = Number(match[1]);
      // While a reply streams its sources may not have arrived: the chip shows, without a link.
      const source = turn.sources?.[index - 1] ?? {
        id: `pending-${String(index)}`,
        title: m.source(index),
      };
      return <ChatSourceChip index={index} source={source} />;
    },
  });
  const followed = announcedTurn(conversation);
  const busy = status !== 'idle';

  const send = (text: string) => onSend(text, []);

  return (
    <section
      data-slot="ai-chat-thread"
      aria-label={m.label}
      className={cn('flex min-h-0 flex-col bg-surface', className)}
    >
      {header}
      <ChatThread
        label={m.label}
        className="flex-1"
        contentClassName={cn('max-w-2xl', conversation.length === 0 && 'min-h-full')}
        footer={
          <div className="mx-auto w-full max-w-2xl px-4 pb-4">
            <PromptInput {...composer} status={status} onSubmit={onSend} onStop={onStop} />
          </div>
        }
      >
        {conversation.length === 0 &&
          (empty ?? (
            <div
              data-part="empty"
              className="my-auto flex flex-col items-center gap-5 py-8 text-center"
            >
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-heading tracking-tight text-fg text-balance">
                  {m.emptyTitle}
                </h2>
                <p className="text-base text-fg-muted text-pretty">{m.emptyDescription}</p>
              </div>
              {suggestions.length > 0 && (
                <ul
                  role="list"
                  aria-label={m.suggestions}
                  className="grid w-full auto-rows-fr gap-2 sm:grid-cols-2"
                >
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.id} className="flex">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          send(suggestion.prompt ?? suggestion.label);
                        }}
                        className={cn(
                          'group/chip flex w-full cursor-pointer items-center gap-3 rounded-panel bg-surface-sunken px-3.5 py-2.5 text-start text-sm text-fg',
                          'transition-colors duration-fast ease-standard hover:bg-surface-hover',
                          'pointer-coarse:min-h-(--rx-control-height-touch) disabled:cursor-not-allowed disabled:opacity-60',
                          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                        )}
                      >
                        <span className="text-pretty">{suggestion.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

        {chatRows(conversation).map((row) => {
          if (row.kind === 'day') {
            return <ChatDaySeparator key={row.key} date={row.date} locale={locale} now={now} />;
          }
          const { turn, latest } = row;
          if (turn.role !== 'assistant') {
            return (
              <ChatMessage
                key={row.key}
                from={turn.role}
                timestamp={turn.createdAt}
                locale={locale}
                status={turn.status}
                error={turn.error}
                onRetry={
                  onRetry === undefined
                    ? undefined
                    : () => {
                        onRetry(turn);
                      }
                }
              >
                {turn.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-pretty">{turn.content}</p>
                ) : (
                  turn.content
                )}
              </ChatMessage>
            );
          }
          const streaming = turn.status === 'streaming';
          const settled = !streaming && turn.content !== '';
          return (
            <ChatMessage
              key={row.key}
              from="assistant"
              author={m.assistant}
              avatar={avatar}
              timestamp={turn.createdAt}
              locale={locale}
              status={turn.status}
              error={turn.error}
              onRetry={
                onRetry === undefined
                  ? undefined
                  : () => {
                      onRetry(turn);
                    }
              }
              actions={
                settled ? (
                  <MessageActions>
                    <MessageCopyAction value={() => markdownToText(turn.content)} />
                    {onFeedback !== undefined && (
                      <MessageFeedback
                        value={turn.feedback ?? null}
                        onValueChange={(value) => {
                          onFeedback(turn, value);
                        }}
                      />
                    )}
                    {latest && onRegenerate !== undefined && (
                      <MessageRegenerateAction
                        disabled={busy}
                        onClick={() => {
                          onRegenerate(turn);
                        }}
                      />
                    )}
                  </MessageActions>
                ) : undefined
              }
              actionsVisibility={latest ? 'always' : 'hover'}
            >
              {turn.reasoning !== undefined && (
                <Reasoning status={turn.reasoning.status} duration={turn.reasoning.duration}>
                  <Markdown size="sm" streaming={turn.reasoning.status === 'thinking'}>
                    {turn.reasoning.text}
                  </Markdown>
                </Reasoning>
              )}
              {turn.tools !== undefined && turn.tools.length > 0 && (
                <div className="flex flex-col gap-1">
                  {turn.tools.map((tool) => (
                    <ToolCall
                      key={tool.id}
                      name={tool.name}
                      title={tool.title}
                      status={tool.status}
                      args={tool.args}
                      result={tool.result}
                      error={tool.error}
                      duration={tool.duration}
                    />
                  ))}
                </div>
              )}
              {turn.content !== '' && (
                <StreamingText text={turn.content} streaming={streaming}>
                  {(text, live) => (
                    <Markdown streaming={live} components={citations(turn)}>
                      {text}
                    </Markdown>
                  )}
                </StreamingText>
              )}
              {turn.sources !== undefined && turn.sources.length > 0 && settled && (
                <ChatSources sources={turn.sources} />
              )}
            </ChatMessage>
          );
        })}

        {awaitingReply(conversation, status) && <ChatLoader label={m.typing(m.assistant)} />}
      </ChatThread>
      <ChatAnnouncer
        id={followed?.id}
        text={followed?.content ?? ''}
        status={
          followed === undefined
            ? 'idle'
            : followed.status === 'streaming'
              ? 'streaming'
              : followed.status === 'error'
                ? 'error'
                : 'done'
        }
        author={m.assistant}
      />
    </section>
  );
}
