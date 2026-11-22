'use client';

import { AiMotionParts } from '../lib/motion-parts';
import { AiChatThread as PlainAiChatThread, type AiChatThreadProps } from './chat-thread';

export type { AiChatThreadProps };

/**
 * AiChatThread with the motion parts: new messages rise into place, the typing dots fade up and
 * replies reveal at an even pace on whole words. Same props; plain under reduced motion.
 */
export function AiChatThread(props: AiChatThreadProps) {
  return (
    <AiMotionParts>
      <PlainAiChatThread {...props} />
    </AiMotionParts>
  );
}
