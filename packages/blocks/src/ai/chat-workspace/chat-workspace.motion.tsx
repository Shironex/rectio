'use client';

import { AiMotionParts } from '../lib/motion-parts';
import { ChatWorkspace as PlainChatWorkspace, type ChatWorkspaceProps } from './chat-workspace';

export type { ChatWorkspaceProps };

/** ChatWorkspace with the motion parts: new messages rise into place and replies reveal at an even pace. Same props; plain under reduced motion. */
export function ChatWorkspace(props: ChatWorkspaceProps) {
  return (
    <AiMotionParts>
      <PlainChatWorkspace {...props} />
    </AiMotionParts>
  );
}
