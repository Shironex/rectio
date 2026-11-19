import { SaasMotionParts } from '../lib/saas-motion-parts';
import { CommentThread as PlainCommentThread, type CommentThreadProps } from './comment-thread';

export type { CommentThreadProps };

/** CommentThread with the motion parts: same props, plain under reduced motion. */
export function CommentThread(props: CommentThreadProps) {
  return (
    <SaasMotionParts>
      <PlainCommentThread {...props} />
    </SaasMotionParts>
  );
}
