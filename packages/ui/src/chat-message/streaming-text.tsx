import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { streamingCaret } from '../markdown/markdown-messages';

export interface StreamingTextProps {
  /** Everything received so far. */
  text: string;
  /** True while more text is on its way: shows the caret and marks the text busy. */
  streaming?: boolean | undefined;
  /**
   * Draws the text, for Markdown: `{(text, streaming) => <Markdown streaming={streaming}>{text}</Markdown>}`.
   * Without it the text shows as it is, with the caret after it.
   */
  children?: ((text: string, streaming: boolean) => ReactNode) | undefined;
  className?: string | undefined;
}

/**
 * Text from a stream. The plain one shows every chunk the moment it lands; the motion twin in
 * `@rectio/motion/chat` evens out bursty chunks into a steady reveal. Both take the same props,
 * so an app picks one by import path. It is `aria-busy` while streaming, so assistive technology
 * waits for the finished text; pair it with `ChatAnnouncer` to say the reply once it is done.
 */
export function StreamingText({
  text,
  streaming = false,
  children,
  className,
}: StreamingTextProps) {
  return (
    <div
      data-slot="streaming-text"
      data-streaming={streaming || undefined}
      aria-busy={streaming || undefined}
      className={cn('min-w-0', className)}
    >
      {children === undefined ? (
        <p className={cn('whitespace-pre-wrap text-pretty', streaming && streamingCaret)}>{text}</p>
      ) : (
        children(text, streaming)
      )}
    </div>
  );
}
