'use client';

import {
  type CommentAuthor,
  CommentThread,
  type CommentThreadProps,
  type CommentThreadResolution,
  type ThreadComment,
} from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

const NIAMH: CommentAuthor = { id: 'niamh', name: 'Niamh Walsh', role: 'Owner' };
const INES: CommentAuthor = { id: 'ines', name: 'Ines Duarte', role: 'Finance' };
const CALLUM: CommentAuthor = { id: 'callum', name: 'Callum Ross', role: 'Engineering' };
const AIYANA: CommentAuthor = { id: 'aiyana', name: 'Aiyana Brooks' };

const COMMENTS: ThreadComment[] = [
  {
    id: 'k1',
    author: INES,
    body: 'The approval rule fires twice when a cost centre has two approvers on the same level. @Callum can you check whether it is the rule or the queue?',
    createdAt: ago(60 * 26),
  },
  {
    id: 'k2',
    author: CALLUM,
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
    body: 'Design side: the approver list now shows who already decided, so a second approver sees it before opening the request. Screens are in the March file.',
    createdAt: ago(45),
  },
];

/** The demo's props: the app owns the data, here in state, in your app through your API. */
export function useCommentThreadDemo() {
  const [comments, setComments] = useState(COMMENTS);
  const [resolved, setResolved] = useState<CommentThreadResolution | undefined>();
  const props: CommentThreadProps = {
    title: 'FER-218 discussion',
    comments,
    writer: NIAMH,
    now: NOW,
    locale: 'en-GB',
    resolved,
    onAdd: (body, parentId) => {
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
    },
    onEdit: (id, body) => {
      setComments(comments.map((c) => (c.id === id ? { ...c, body, editedAt: NOW } : c)));
    },
    onDelete: (id) => {
      setComments(comments.filter((c) => c.id !== id));
    },
    onCopyLink: () => undefined,
    onResolve: () => {
      setResolved({ by: NIAMH.name, at: NOW });
    },
    onReopen: () => {
      setResolved(undefined);
    },
  };
  return props;
}

export default function CommentThreadDemo() {
  const props = useCommentThreadDemo();
  return (
    <div className="w-full">
      <CommentThread {...props} />
    </div>
  );
}
