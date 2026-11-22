'use client';

import { ChatLoader, ChatMessage, ChatThread, StreamingText } from '@rectio/ui';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

/** Where an entering element comes from: up from below, or in from the end edge. */
export type AiEnterFrom = 'below' | 'end';

export type AiEnterProps = ComponentProps<'div'> & {
  /** Default `below`. */
  from?: AiEnterFrom | undefined;
};

/** The plain entrance: the element is simply there. */
function PlainEnter({ from = 'below', ...props }: AiEnterProps) {
  return <div data-enter-from={from} {...props} />;
}

/**
 * The pieces of an AI block that move in the motion variant. A block draws these instead of
 * importing them, so one block body serves both variants: `@rectio/blocks/ai` renders it with the
 * plain parts, `@rectio/blocks/ai/motion` with the ones from `@rectio/motion/chat`. Apps never
 * need this context; they pick a variant by import path.
 */
export interface AiParts {
  ChatThread: typeof ChatThread;
  ChatMessage: typeof ChatMessage;
  StreamingText: typeof StreamingText;
  ChatLoader: typeof ChatLoader;
  /** A box that fades in as it mounts in the motion variant: a panel opening, a popup. */
  Enter: (props: AiEnterProps) => ReactNode;
}

export const PLAIN_AI_PARTS: AiParts = {
  ChatThread,
  ChatMessage,
  StreamingText,
  ChatLoader,
  Enter: PlainEnter,
};

const AiPartsContext = createContext<AiParts>(PLAIN_AI_PARTS);

export function AiPartsProvider({ parts, children }: { parts: AiParts; children: ReactNode }) {
  return <AiPartsContext value={parts}>{children}</AiPartsContext>;
}

export function useAiParts(): AiParts {
  return use(AiPartsContext);
}
