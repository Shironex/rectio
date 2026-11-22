'use client';

import { ArrowDownIcon } from '@phosphor-icons/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';

import { Button } from '../button/button';
import { cn } from '../lib/cn';
import { markdownToText } from '../markdown/markdown-parse';
import {
  type ChatThreadMessages,
  CHAT_THREAD_MESSAGES,
  chatDayLabel,
  startOfDay,
  type ChatAnnouncerMessages,
  CHAT_ANNOUNCER_MESSAGES,
} from './chat-thread-messages';

/** How close to the end, in pixels, still counts as reading the latest message. */
const PIN_SLACK = 48;

export interface ChatThreadProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The messages, day separators and loaders, oldest first. */
  children?: ReactNode;
  /** Names the conversation for assistive technology. Default "Conversation". */
  label?: string | undefined;
  /** Class for the inner column that holds the messages, such as a reading measure. */
  contentClassName?: string | undefined;
  /** Content pinned under the scrolling messages, normally the `PromptInput`. */
  footer?: ReactNode;
  messages?: Partial<ChatThreadMessages> | undefined;
  /** The scrolling element, for an app that scrolls it itself. */
  scrollRef?: Ref<HTMLDivElement> | undefined;
}

/** Hands a node to a ref the caller passed, whatever its shape. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null && ref !== undefined) ref.current = value;
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Keeps a scroller pinned to its end while the content below grows, until the reader scrolls up.
 * Growth is watched with a ResizeObserver on the content, so a streamed reply, an image that loads
 * or a tool call that opens all keep the latest words in view.
 */
function useStickToBottom() {
  const scroller = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback(() => {
    const element = scroller.current;
    if (element === null) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    pinned.current = distance <= PIN_SLACK;
    setAtEnd(pinned.current);
  }, []);

  const toEnd = useCallback((smooth: boolean) => {
    const element = scroller.current;
    if (element === null) return;
    pinned.current = true;
    setAtEnd(true);
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    });
  }, []);

  // A thread opens at its newest message.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element !== null) element.scrollTop = element.scrollHeight;
  }, []);

  useEffect(() => {
    const element = content.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const box = scroller.current;
      // Jump, never glide, while pinned: a stream grows many times a second.
      if (pinned.current && box !== null) box.scrollTop = box.scrollHeight;
      else measure();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [measure]);

  const attach = useCallback((node: HTMLDivElement | null) => {
    scroller.current = node;
  }, []);

  return { scroller, attach, content, atEnd, measure, toEnd };
}

/**
 * The scrolling conversation. It opens at the newest message and follows a reply as it streams in,
 * until the reader scrolls up to read; then it holds still and offers Jump to latest. It is a
 * `log` with live announcements off, so a streamed reply is not read out word by word: use
 * `ChatAnnouncer` to say each finished reply once. The scroller takes focus, so the keyboard can
 * scroll it. Lay it out in a column of a fixed height (a panel, `h-dvh`), with the prompt input in
 * `footer`.
 */
export function ChatThread({
  children,
  label,
  contentClassName,
  footer,
  messages: overrides,
  scrollRef,
  className,
  ...props
}: ChatThreadProps) {
  const m = { ...CHAT_THREAD_MESSAGES, ...overrides };
  const { scroller, attach, content, atEnd, measure, toEnd } = useStickToBottom();
  return (
    <div
      data-slot="chat-thread"
      className={cn('relative flex min-h-0 flex-col', className)}
      {...props}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={(node) => {
            attach(node);
            assignRef(scrollRef, node);
          }}
          role="log"
          aria-live="off"
          aria-label={label ?? m.label}
          // The scroller takes focus so the arrow keys and Page Down scroll it without a pointer.
          tabIndex={0}
          onScroll={measure}
          data-part="scroller"
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus',
          )}
        >
          <div
            ref={content}
            data-part="content"
            className={cn('mx-auto flex w-full flex-col gap-6 px-4 py-6', contentClassName)}
          >
            {children}
          </div>
        </div>
        {!atEnd && (
          // A fade under the button keeps it off the words it floats over.
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-surface via-surface to-transparent pt-10 pb-4">
            <Button
              size="sm"
              variant="secondary"
              data-part="jump"
              className="pointer-events-auto rounded-full shadow-overlay"
              onClick={() => {
                toEnd(true);
                // The button leaves with the jump; the conversation keeps the focus.
                scroller.current?.focus({ preventScroll: true });
              }}
            >
              <ArrowDownIcon aria-hidden weight="bold" className="size-3.5" />
              {m.jumpToLatest}
            </Button>
          </div>
        )}
      </div>
      {footer !== undefined && footer !== null && (
        <div data-part="footer" className="shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}

export interface ChatDaySeparatorProps extends Omit<ComponentProps<'div'>, 'children'> {
  date: Date;
  locale?: string | undefined;
  /** "Today" is measured from this moment. Default now. */
  now?: Date | undefined;
}

/** Marks where a new day starts in a conversation, between hairlines. */
export function ChatDaySeparator({
  date,
  locale,
  now,
  className,
  ...props
}: ChatDaySeparatorProps) {
  const label = chatDayLabel(date, { now, locale });
  return (
    <div
      role="separator"
      aria-label={label}
      data-slot="chat-day-separator"
      className={cn(
        'flex items-center gap-3 text-xs font-medium text-fg-subtle',
        'before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line',
        className,
      )}
      {...props}
    >
      <time dateTime={startOfDay(date).toISOString()}>{label}</time>
    </div>
  );
}

export interface ChatAnnouncerProps {
  /** The reply being announced. A new id starts a new announcement. */
  id: string | null | undefined;
  /** The reply as Markdown; its markers are left out of what is said. */
  text: string;
  status: 'streaming' | 'done' | 'error' | 'idle';
  /** The assistant's name. Default "Assistant". */
  author?: string | undefined;
  messages?: Partial<ChatAnnouncerMessages> | undefined;
}

/**
 * A polite live region for the newest assistant reply. It says once that a reply has started and
 * once, when it is complete, the whole reply as plain words: never each chunk of a stream, which
 * would talk over itself. Render one per conversation, outside the thread.
 */
export function ChatAnnouncer({
  id,
  text,
  status,
  author = 'Assistant',
  messages: overrides,
}: ChatAnnouncerProps) {
  // Read through a ref: a fresh messages object each render must not re-run the announcement.
  const words = useRef(CHAT_ANNOUNCER_MESSAGES);
  useLayoutEffect(() => {
    words.current = { ...CHAT_ANNOUNCER_MESSAGES, ...overrides };
  });
  const [said, setSaid] = useState('');
  const seen = useRef<{ id: string | null | undefined; streamed: boolean; finished: boolean }>({
    id: undefined,
    streamed: false,
    finished: false,
  });

  useEffect(() => {
    const state = seen.current;
    if (id !== state.id) seen.current = { id, streamed: false, finished: false };
    const current = seen.current;
    if (id === null || id === undefined) return;
    const m = words.current;
    if (status === 'streaming' && !current.streamed) {
      current.streamed = true;
      setSaid(m.writing(author));
    } else if (status === 'done' && current.streamed && !current.finished) {
      current.finished = true;
      setSaid(m.done(author, markdownToText(text)));
    } else if (status === 'error' && current.streamed && !current.finished) {
      current.finished = true;
      setSaid(m.failed(author));
    }
  }, [id, status, text, author]);

  return (
    <div aria-live="polite" aria-atomic="true" data-slot="chat-announcer" className="sr-only">
      {said}
    </div>
  );
}

export {
  type ChatThreadMessages,
  CHAT_THREAD_MESSAGES,
  isSameDay,
  chatDayLabel,
  type ChatAnnouncerMessages,
  CHAT_ANNOUNCER_MESSAGES,
} from './chat-thread-messages';
