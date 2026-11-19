import {
  CommentThread as PlainCommentThread,
  type CommentAuthor,
  type CommentThreadResolution,
  type ThreadComment,
} from '@rectio/blocks';
import { CommentThread as MotionCommentThread } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

const NIAMH: CommentAuthor = { id: 'niamh', name: 'Niamh Walsh', role: 'Owner' };
const INES: CommentAuthor = { id: 'ines', name: 'Ines Duarte', role: 'Finance' };
const TOMASZ: CommentAuthor = { id: 'tomasz', name: 'Tomasz Wierzbicki', role: 'Engineering' };
const AIYANA: CommentAuthor = { id: 'aiyana', name: 'Aiyana Brooks' };

const COMMENTS: ThreadComment[] = [
  {
    id: 'k1',
    author: INES,
    body: 'The approval rule fires twice when a cost centre has two approvers on the same level. @Tomasz can you check whether it is the rule or the queue?',
    createdAt: ago(60 * 26),
  },
  {
    id: 'k2',
    author: TOMASZ,
    parentId: 'k1',
    body: 'It is the queue. Both approvers get their own job and neither sees the other one finish. Fix is up for review.',
    createdAt: ago(60 * 20),
  },
  {
    id: 'k3',
    author: NIAMH,
    parentId: 'k2',
    body: 'Thanks. Can we add a test with three approvers too?',
    createdAt: ago(60 * 3),
    editedAt: ago(60 * 2),
  },
  {
    id: 'k4',
    author: AIYANA,
    body: 'Design side: the approver list now shows who already decided, so a second approver sees it before opening the request.\nScreens are in the March file.',
    createdAt: ago(45),
  },
];

export function CommentThreadDemo({ motion, empty, locale }: DemoProps) {
  const CommentThread = motion ? MotionCommentThread : PlainCommentThread;
  const [comments, setComments] = useState(empty ? [] : COMMENTS);
  const [resolved, setResolved] = useState<CommentThreadResolution | undefined>();
  return (
    <CommentThread
      title="FER-218 discussion"
      comments={comments}
      writer={NIAMH}
      now={NOW}
      locale={locale}
      resolved={resolved}
      onAdd={(body, parentId) => {
        setComments([
          ...comments,
          {
            id: `n${String(comments.length + 1)}`,
            author: NIAMH,
            body,
            createdAt: NOW,
            ...(parentId === undefined ? {} : { parentId }),
          },
        ]);
      }}
      onEdit={(id, body) => {
        setComments(comments.map((c) => (c.id === id ? { ...c, body, editedAt: NOW } : c)));
      }}
      onCopyLink={() => undefined}
      onDelete={(id) => {
        setComments(comments.filter((c) => c.id !== id));
      }}
      onResolve={() => {
        setResolved({ by: NIAMH.name, at: NOW });
      }}
      onReopen={() => {
        setResolved(undefined);
      }}
    />
  );
}
