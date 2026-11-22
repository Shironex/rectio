'use client';

import { AiMotionParts } from '../lib/motion-parts';
import { PromptComposer as PlainPromptComposer, type PromptComposerProps } from './prompt-composer';

export type { PromptComposerProps };

/** PromptComposer with the motion parts: the command list rises in above the field. Same props; plain under reduced motion. */
export function PromptComposer(props: PromptComposerProps) {
  return (
    <AiMotionParts>
      <PlainPromptComposer {...props} />
    </AiMotionParts>
  );
}
