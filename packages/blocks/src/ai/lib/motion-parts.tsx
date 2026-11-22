'use client';

import { readMotionTokens, usePlainMotion } from '@rectio/motion';
import { ChatLoader, ChatMessage, ChatThread, StreamingText } from '@rectio/motion/chat';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { AiPartsProvider, type AiEnterProps, type AiParts } from './parts';

/**
 * A box that fades in and moves the token shift distance as it mounts: up from below, or in from
 * the end edge (mirrored in right to left). Transform and opacity only, on the enter easing, and
 * once per mount. Plain under reduced motion.
 */
function Enter({ from = 'below', ref, ...props }: AiEnterProps) {
  const node = useRef<HTMLDivElement | null>(null);
  const plain = usePlainMotion();
  useLayoutEffect(() => {
    const element = node.current;
    if (plain || element === null || typeof element.animate !== 'function') return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const rtl = getComputedStyle(element).direction === 'rtl';
    const shift = tokens.distance.shift;
    const start = from === 'end' ? `translateX(${rtl ? '-' : ''}${shift})` : `translateY(${shift})`;
    const animation = element.animate(
      [
        { opacity: 0, transform: start },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: tokens.duration.base * 1000,
        easing:
          getComputedStyle(element).getPropertyValue('--rx-motion-easing-enter').trim() || 'linear',
        fill: 'backwards',
      },
    );
    return () => {
      animation.cancel();
    };
    // Plays on mount only: a box already on screen never enters again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plain]);
  return (
    <div
      ref={(element) => {
        node.current = element;
        if (typeof ref === 'function') return ref(element);
        if (ref) ref.current = element;
        return undefined;
      }}
      {...props}
    />
  );
}

/** The motion parts every AI block's motion twin renders with. */
export const MOTION_AI_PARTS: AiParts = {
  ChatThread,
  ChatMessage,
  StreamingText,
  ChatLoader,
  Enter,
};

/** Renders an AI block body with the motion parts. */
export function AiMotionParts({ children }: { children: ReactNode }) {
  return <AiPartsProvider parts={MOTION_AI_PARTS}>{children}</AiPartsProvider>;
}
