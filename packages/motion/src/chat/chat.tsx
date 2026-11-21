import {
  ChatLoader as PlainChatLoader,
  ChatMessage as PlainChatMessage,
  ChatThread as PlainChatThread,
  StreamingText as PlainStreamingText,
  type ChatLoaderProps,
  type ChatMessageProps,
  type ChatThreadProps,
  type StreamingTextProps,
} from '@rectio/ui';
import {
  createContext,
  useCallback,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { cssEasing } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { ChatLoaderProps, ChatMessageProps, ChatThreadProps, StreamingTextProps };

/**
 * True once a thread has drawn the messages it opened with. Messages present at that point are
 * history and appear still; only messages that arrive afterwards play their entrance.
 */
const ThreadSettled = createContext<(() => boolean) | null>(null);

/** Fades an element in and lifts it by the shift distance, once, as it mounts. */
function useEnter(ref: RefObject<HTMLElement | null>, enabled: boolean, duration: 'base' | 'slow') {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const animation = element.animate(
      [
        { opacity: 0, transform: `translateY(${tokens.distance.shift})` },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: tokens.duration[duration] * 1000,
        easing: cssEasing(element, 'enter'),
        fill: 'backwards',
      },
    );
    return () => {
      animation.cancel();
    };
    // Plays on mount only: a message that is already in place never enters again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * ChatThread that tells its messages which ones are history, so only new messages enter. Same
 * props as the plain one.
 */
export function ChatThread(props: ChatThreadProps) {
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);
  const isSettled = useCallback(() => settled.current, []);
  return (
    <ThreadSettled value={isSettled}>
      <PlainChatThread {...props} />
    </ThreadSettled>
  );
}

/**
 * A message that rises into place as it arrives. Messages a thread opened with stay still, and
 * under reduced motion every message is plain. Same props as the plain one.
 */
export function ChatMessage({ ref, ...props }: ChatMessageProps) {
  const plain = usePlainMotion();
  const settled = use(ThreadSettled);
  // Decided once, at mount: history stays still, later arrivals enter.
  const [enters] = useState(() => settled === null || settled());
  const node = useRef<HTMLElement | null>(null);
  useEnter(node, enters && !plain, 'base');
  return (
    <PlainChatMessage
      {...props}
      data-motion={plain ? undefined : ''}
      ref={(element: HTMLElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

/** Typing dots that fade up into the reply's place. Same props as the plain one. */
export function ChatLoader({ ref, ...props }: ChatLoaderProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLDivElement | null>(null);
  useEnter(node, !plain && props.variant !== 'skeleton', 'base');
  return (
    <PlainChatLoader
      {...props}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

/**
 * How much of `text` to show. Streams arrive in bursts (a word, then forty), so the shown text
 * walks towards what has arrived at a pace that empties the backlog within one slow duration,
 * never slower than a steady floor: bursts read as an even flow and nothing lags far behind. It
 * stops on word ends where it can, so a word never appears in halves. A new text that does not
 * continue the old one (a new reply, an edit) shows at once.
 */
export function useSmoothText(
  text: string,
  streaming: boolean,
  host: RefObject<HTMLElement | null>,
  enabled: boolean,
): string {
  const [shown, setShown] = useState(text.length);
  const [previous, setPrevious] = useState(text);
  // Adjusted while rendering: text that does not continue what is shown starts over in full.
  if (previous !== text) {
    setPrevious(text);
    if (!text.startsWith(previous.slice(0, shown))) setShown(text.length);
  }
  const latest = useRef(text);
  const count = useRef(shown);
  useLayoutEffect(() => {
    latest.current = text;
    count.current = shown;
  });

  const active = enabled && (streaming || shown < text.length);
  // The loop restarts when more text arrives and stops once it has caught up, so a paused stream
  // costs nothing.
  const behind = active && shown < text.length;
  useEffect(() => {
    if (!behind) return;
    const element = host.current;
    const tokens = element === null ? null : readMotionTokens(element);
    if (tokens === null) {
      setShown(latest.current.length);
      return;
    }
    const span = tokens.duration.slow * 1000;
    let frame = 0;
    let last: number | null = null;
    let carry = 0;
    const tick = (now: number) => {
      // About thirty steps a second: smooth to the eye, and half the Markdown parses of every frame.
      if (last !== null && now - last < 32) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const elapsed = last === null ? 32 : now - last;
      last = now;
      const goal = latest.current;
      const backlog = goal.length - count.current;
      if (backlog <= 0) return;
      // Characters per millisecond: the backlog over one slow duration, at least 40 a second.
      carry += Math.max(backlog / span, 0.04) * elapsed;
      const step = Math.floor(carry);
      carry -= step;
      let next = Math.min(goal.length, count.current + step);
      // Finish the word in hand rather than stopping inside it.
      const space = goal.slice(next).search(/\s/);
      if (step > 0 && space > 0 && space <= 12) next = Math.min(goal.length, next + space);
      if (next !== count.current) {
        count.current = next;
        setShown(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [behind, host, text.length]);

  return enabled ? text.slice(0, Math.min(shown, text.length)) : text;
}

/**
 * Streaming text that evens out bursty chunks into a steady reveal, ending on whole words. Under
 * reduced motion it is the plain one: every chunk shows as it lands. Same props as the plain one.
 */
export function StreamingText({ text, streaming = false, ...props }: StreamingTextProps) {
  const plain = usePlainMotion();
  const host = useRef<HTMLSpanElement>(null);
  const smooth = useSmoothText(text, streaming, host, !plain);
  const revealing = smooth.length < text.length;
  return (
    <>
      <span ref={host} hidden data-slot="streaming-text-host" />
      <PlainStreamingText {...props} text={smooth} streaming={streaming || revealing} />
    </>
  );
}
