import { ChatLoader, ChatMessage, ChatThread, StreamingText } from '@rectio/motion/chat';

import { AiPartsProvider, type AiParts } from '../lib/parts';
import { AiChatThread as PlainAiChatThread, type AiChatThreadProps } from './chat-thread';

export type { AiChatThreadProps };

const MOTION_PARTS: AiParts = { ChatThread, ChatMessage, StreamingText, ChatLoader };

/**
 * AiChatThread with the motion parts: new messages rise into place, the typing dots fade up and
 * replies reveal at an even pace on whole words. Same props; plain under reduced motion.
 */
export function AiChatThread(props: AiChatThreadProps) {
  return (
    <AiPartsProvider parts={MOTION_PARTS}>
      <PlainAiChatThread {...props} />
    </AiPartsProvider>
  );
}
