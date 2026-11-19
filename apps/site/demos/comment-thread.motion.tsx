'use client';

import { CommentThread } from '@rectio/blocks/motion';

import { useCommentThreadDemo } from './comment-thread';

export default function CommentThreadMotionDemo() {
  const props = useCommentThreadDemo();
  return (
    <div className="w-full">
      <CommentThread {...props} />
    </div>
  );
}
