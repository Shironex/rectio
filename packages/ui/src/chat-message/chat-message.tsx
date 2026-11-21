import {
  ArrowClockwiseIcon,
  CircleNotchIcon,
  StopCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { useId, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';

import { Button } from '../button/button';
import { cn } from '../lib/cn';
import { Textarea } from '../textarea/textarea';

export type ChatMessageFrom = 'user' | 'assistant' | 'system';
export type ChatMessageStatus = 'sending' | 'sent' | 'streaming' | 'stopped' | 'error';

/** Every sentence a chat message says, for apps that translate or reword them. */
export interface ChatMessageMessages {
  /** The name read for the user's own messages when `author` is not given. */
  you: string;
  /** The name read for the assistant's messages when `author` is not given. */
  assistant: string;
  sending: string;
  stopped: string;
  /** Shown with `status: 'error'` when `error` is not given. */
  failed: string;
  retry: string;
  save: string;
  cancel: string;
  /** Names the edit field. */
  editLabel: string;
}

export const CHAT_MESSAGE_MESSAGES: ChatMessageMessages = {
  you: 'You',
  assistant: 'Assistant',
  sending: 'Sending',
  stopped: 'Stopped',
  failed: 'The message could not be sent.',
  retry: 'Retry',
  save: 'Save and send',
  cancel: 'Cancel',
  editLabel: 'Edit message',
};

export interface ChatMessageProps extends Omit<ComponentProps<'article'>, 'children' | 'role'> {
  /** Who wrote it: the user's own words, the assistant's reply, or a note from the system. */
  from: ChatMessageFrom;
  /** The name shown and read with the message. Defaults to "You" or "Assistant". */
  author?: string | undefined;
  /** An `Avatar` or a mark beside an assistant or user message. System notes have none. */
  avatar?: ReactNode;
  /** When it was written. Shown as a time, with the full date as its `dateTime`. */
  timestamp?: Date | string | number | undefined;
  /** BCP 47 locale for the time. */
  locale?: string | undefined;
  /**
   * `sending` while the user's words are on their way, `streaming` while the reply arrives,
   * `stopped` when the user stopped it, `error` when it failed.
   */
  status?: ChatMessageStatus | undefined;
  /** Why it failed, in words the user can act on. Shown with `status: 'error'`. */
  error?: ReactNode;
  /** Offers Retry with the error. */
  onRetry?: (() => void) | undefined;
  /** `MessageActions` for this message: copy, regenerate, feedback, edit. */
  actions?: ReactNode;
  /**
   * `hover` shows the actions when the message is hovered or holds focus, and always on touch
   * screens; `always` keeps them in view, as on the latest reply.
   */
  actionsVisibility?: 'hover' | 'always' | undefined;
  messages?: Partial<ChatMessageMessages> | undefined;
  /** The content: `Markdown`, `StreamingText`, sources, tool calls, attachments. */
  children?: ReactNode;
}

function toDate(value: Date | string | number | undefined): Date | null {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * One message of a conversation. The user's words sit in a bubble at the end edge; the
 * assistant's reply runs the full width beside its avatar, so long answers, tables and code read
 * at a comfortable measure; system notes sit centred and quiet. Each message is an `article` named
 * by its author and time, so a screen reader can move from message to message. Status shows in
 * words as well as an icon: sending, stopped, and a failure with its reason and Retry.
 */
export function ChatMessage({
  from,
  author,
  avatar,
  timestamp,
  locale,
  status,
  error,
  onRetry,
  actions,
  actionsVisibility = 'hover',
  messages: overrides,
  className,
  children,
  ...props
}: ChatMessageProps) {
  const m = { ...CHAT_MESSAGE_MESSAGES, ...overrides };
  const nameId = useId();
  const date = toDate(timestamp);
  const name = author ?? (from === 'user' ? m.you : m.assistant);
  const time =
    date === null ? null : (
      <time
        dateTime={date.toISOString()}
        title={new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
          date,
        )}
        className="text-xs text-fg-subtle numeric"
      >
        {new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date)}
      </time>
    );

  if (from === 'system') {
    return (
      <article
        data-slot="chat-message"
        data-from="system"
        aria-label={typeof children === 'string' ? children : undefined}
        className={cn(
          'flex items-center gap-3 text-center text-sm text-fg-muted',
          'before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line',
          className,
        )}
        {...props}
      >
        <span className="max-w-prose text-pretty">
          {children}
          {time !== null && <> {time}</>}
        </span>
      </article>
    );
  }

  const isUser = from === 'user';
  const failed = status === 'error';
  const statusLine =
    status === 'sending' ? (
      <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <CircleNotchIcon
          aria-hidden
          weight="bold"
          className="size-3.5 animate-spin motion-reduce:animate-breathe"
        />
        {m.sending}
      </span>
    ) : status === 'stopped' ? (
      <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <StopCircleIcon aria-hidden weight="bold" className="size-3.5" />
        {m.stopped}
      </span>
    ) : failed ? (
      <span
        role="alert"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-negative-strong"
      >
        <span className="flex items-start gap-1.5">
          <WarningCircleIcon aria-hidden weight="bold" className="mt-0.5 size-4 shrink-0" />
          <span>{error ?? m.failed}</span>
        </span>
        {onRetry !== undefined && (
          <Button size="sm" variant="secondary" onClick={onRetry} data-part="retry">
            <ArrowClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
            {m.retry}
          </Button>
        )}
      </span>
    ) : null;

  return (
    <article
      data-slot="chat-message"
      data-from={from}
      data-status={status}
      aria-labelledby={nameId}
      aria-busy={status === 'streaming' || undefined}
      className={cn(
        'group/message flex w-full min-w-0 gap-3',
        isUser && 'flex-row-reverse',
        className,
      )}
      {...props}
    >
      {avatar !== undefined && avatar !== null && (
        // Phones give the reply the full width; the name above it already says who wrote it.
        <div data-part="avatar" className="flex shrink-0 pt-0.5 max-sm:hidden">
          {avatar}
        </div>
      )}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1.5',
          // The user's bubble never runs edge to edge, so whose words are whose reads at a glance.
          isUser ? 'items-end ps-10' : 'items-start',
        )}
      >
        <header
          className={cn(
            'flex items-baseline gap-2',
            // The user's name is said, not shown: their bubble already says whose words these are.
            isUser && time === null && 'sr-only',
          )}
        >
          <span id={nameId} className={cn('text-sm font-medium text-fg', isUser && 'sr-only')}>
            {name}
          </span>
          {time}
        </header>
        <div
          data-part="body"
          className={cn(
            'min-w-0',
            isUser
              ? cn(
                  'max-w-xl rounded-panel border border-line bg-surface-sunken px-3.5 py-2.5 text-fg',
                  'whitespace-pre-wrap wrap-anywhere',
                  failed && 'border-negative bg-negative-subtle',
                )
              : 'flex w-full flex-col gap-3',
          )}
        >
          {children}
        </div>
        {statusLine}
        {actions !== undefined && actions !== null && (
          <div
            data-part="actions"
            className={cn(
              'flex',
              actionsVisibility === 'hover' &&
                cn(
                  'pointer-fine:opacity-0 pointer-fine:transition-opacity pointer-fine:duration-fast pointer-fine:ease-standard',
                  'pointer-fine:group-hover/message:opacity-100 pointer-fine:focus-within:opacity-100',
                ),
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}

export interface ChatMessageEditorProps extends Omit<
  ComponentProps<'form'>,
  'onSubmit' | 'children'
> {
  /** The words being edited. */
  defaultValue: string;
  /** Called with the new words. Empty or unchanged words cancel instead. */
  onSave: (value: string) => void;
  onCancel: () => void;
  messages?: Partial<Pick<ChatMessageMessages, 'save' | 'cancel' | 'editLabel'>> | undefined;
}

/**
 * Edits a sent message in place, inside its bubble. It takes focus with the caret at the end;
 * Ctrl or Cmd and Enter saves, Escape cancels, and the app puts focus back on the message's Edit
 * button after either.
 */
export function ChatMessageEditor({
  defaultValue,
  onSave,
  onCancel,
  messages: overrides,
  className,
  ...props
}: ChatMessageEditorProps) {
  const m = { ...CHAT_MESSAGE_MESSAGES, ...overrides };
  const [value, setValue] = useState(defaultValue);
  const save = () => {
    const next = value.trim();
    if (next === '' || next === defaultValue.trim()) onCancel();
    else onSave(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      save();
    }
  };
  return (
    <form
      data-slot="chat-message-editor"
      className={cn('flex w-xl max-w-full min-w-0 flex-col gap-2', className)}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      {...props}
    >
      <Textarea
        aria-label={m.editLabel}
        value={value}
        onValueChange={setValue}
        onKeyDown={onKeyDown}
        minRows={2}
        maxRows={12}
        // The caret lands after the last word, where an edit usually starts.
        autoFocus
        onFocus={(event) => {
          const end = event.currentTarget.value.length;
          event.currentTarget.setSelectionRange(end, end);
        }}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {m.cancel}
        </Button>
        <Button size="sm" type="submit">
          {m.save}
        </Button>
      </div>
    </form>
  );
}

export { StreamingText, type StreamingTextProps } from './streaming-text';
