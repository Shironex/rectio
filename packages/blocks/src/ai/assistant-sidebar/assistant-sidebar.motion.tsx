'use client';

import { AiMotionParts } from '../lib/motion-parts';
import {
  AssistantSidebar as PlainAssistantSidebar,
  type AssistantSidebarProps,
} from './assistant-sidebar';

export type { AssistantSidebarProps };

/** AssistantSidebar with the motion parts: the panel slides in from the end edge as it opens. Same props; plain under reduced motion. */
export function AssistantSidebar(props: AssistantSidebarProps) {
  return (
    <AiMotionParts>
      <PlainAssistantSidebar {...props} />
    </AiMotionParts>
  );
}
