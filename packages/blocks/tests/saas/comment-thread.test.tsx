import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  CommentThread,
  commentBodyError,
  commentParticipants,
  commentParts,
  commentSendModifier,
  commentTree,
  type CommentAuthor,
  type ThreadComment,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const at = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);
const ME: CommentAuthor = { id: 'me', name: 'Niamh Walsh' };
const INES: CommentAuthor = { id: 'ines', name: 'Ines Duarte' };
const COMMENTS: ThreadComment[] = [
  { id: 'c3', author: ME, body: 'Agreed.', createdAt: at(10), parentId: 'c2' },
  { id: 'c1', author: INES, body: 'Can @Tomasz look at this?', createdAt: at(60) },
  { id: 'c2', author: ME, body: 'On it.', createdAt: at(30), parentId: 'c1' },
  { id: 'c4', author: ME, body: 'Orphan reply', createdAt: at(5), parentId: 'gone' },
];

describe('comment thread logic', () => {
  it('nests replies one level under their top-level comment, oldest first', () => {
    const tree = commentTree(COMMENTS);
    expect(tree.map((n) => [n.comment.id, n.replies.map((r) => r.id)])).toEqual([
      ['c1', ['c2', 'c3']],
      ['c4', []],
    ]);
  });

  it('lists participants in the order they first spoke', () => {
    expect(commentParticipants(COMMENTS).map((a) => a.id)).toEqual(['ines', 'me']);
  });

  it('checks a body and picks out mentions', () => {
    expect(commentBodyError('   ')).toBe('Write something first.');
    expect(commentBodyError('abcdef', 4)).toBe('Keep it under 4 characters; this is 2 over.');
    expect(commentBodyError('Fine')).toBeNull();
    expect(commentSendModifier('macOS')).toBe('Cmd');
    expect(commentSendModifier('MacIntel')).toBe('Cmd');
    expect(commentSendModifier('Win32')).toBe('Ctrl');
    expect(commentSendModifier(undefined)).toBe('Ctrl');
    expect(commentParts('Ask @Tomasz.W and mail a@b.io')).toEqual([
      { kind: 'text', text: 'Ask ' },
      { kind: 'mention', text: '@Tomasz.W' },
      { kind: 'text', text: ' and mail a@b.io' },
    ]);
  });
});

describe('CommentThread', () => {
  it('posts a comment with Ctrl and Enter, trimmed', async () => {
    const onAdd = vi.fn();
    render(<CommentThread comments={COMMENTS} writer={ME} now={NOW} onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText('Add a comment'), '  Ship it  ');
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onAdd).toHaveBeenCalledWith('Ship it');
    expect(screen.getByLabelText('Add a comment')).toHaveValue('');
  });

  it('refuses an empty comment and says why', async () => {
    const onAdd = vi.fn();
    render(<CommentThread comments={[]} writer={ME} now={NOW} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText('Write something first.')).toBeInTheDocument();
  });

  it('replies to a top-level comment', async () => {
    const onAdd = vi.fn();
    render(<CommentThread comments={COMMENTS} writer={ME} now={NOW} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reply, Ines Duarte' }));
    await userEvent.type(screen.getByLabelText('Reply to Ines Duarte'), 'Done');
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(onAdd).toHaveBeenCalledWith('Done', 'c1');
  });

  it('edits and deletes only your own comments', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <CommentThread
        comments={COMMENTS.slice(1, 3)}
        writer={ME}
        now={NOW}
        onAdd={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    const menus = screen.getAllByRole('button', { name: /Actions for your comment/ });
    expect(menus).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /Actions for your comment/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const editor = screen.getByLabelText('Edit comment');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'On it now.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledWith('c2', 'On it now.');

    await userEvent.click(screen.getByRole('button', { name: /Actions for your comment/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete comment' }));
    expect(onDelete).toHaveBeenCalledWith('c2');
  });

  it('gives every comment the same menu when links can be copied', async () => {
    const onCopyLink = vi.fn();
    render(
      <CommentThread
        comments={COMMENTS.slice(1, 3)}
        writer={ME}
        now={NOW}
        onAdd={vi.fn()}
        onCopyLink={onCopyLink}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Actions for the comment by Ines Duarte/ }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }));
    expect(onCopyLink).toHaveBeenCalledWith('c1');
  });

  it('returns focus to the comment menu after cancelling an edit', async () => {
    render(
      <CommentThread
        comments={COMMENTS.slice(1, 3)}
        writer={ME}
        now={NOW}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Actions for your comment/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(screen.getByLabelText('Edit comment')).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: /Actions for your comment/ })).toHaveFocus();
  });

  it('replies to a reply in the same thread, one level deep', async () => {
    const onAdd = vi.fn();
    render(<CommentThread comments={COMMENTS} writer={ME} now={NOW} onAdd={onAdd} />);
    const replies = screen.getByRole('list', { name: 'Replies to Ines Duarte' });
    const [first] = within(replies).getAllByRole('button', { name: 'Reply, Niamh Walsh' });
    if (first === undefined) throw new Error('no reply button');
    await userEvent.click(first);
    await userEvent.type(screen.getByLabelText('Reply to Niamh Walsh'), 'Thanks');
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(onAdd).toHaveBeenCalledWith('Thanks', 'c1');
  });

  it('returns focus to Reply after cancelling a reply', async () => {
    render(<CommentThread comments={COMMENTS} writer={ME} now={NOW} onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reply, Ines Duarte' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Reply, Ines Duarte' })).toHaveFocus();
  });

  it('starts a mention from the composer and offers attach when given', async () => {
    const onAttach = vi.fn();
    render(
      <CommentThread comments={[]} writer={ME} now={NOW} onAdd={vi.fn()} onAttach={onAttach} />,
    );
    const field = screen.getByLabelText('Add a comment');
    await userEvent.type(field, 'Ask');
    await userEvent.click(screen.getByRole('button', { name: 'Mention someone' }));
    expect(field).toHaveValue('Ask @');
    await userEvent.click(screen.getByRole('button', { name: 'Attach a file' }));
    expect(onAttach).toHaveBeenCalledOnce();
  });

  it('moves focus to the field after a refused comment', async () => {
    render(<CommentThread comments={[]} writer={ME} now={NOW} onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Add a comment')).toHaveFocus();
    });
  });

  it('shows a resolved thread without a composer and offers to reopen', async () => {
    const onReopen = vi.fn();
    render(
      <CommentThread
        comments={COMMENTS}
        writer={ME}
        now={NOW}
        onAdd={vi.fn()}
        resolved={{ by: 'Ines Duarte', at: at(2) }}
        onReopen={onReopen}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Resolved by Ines Duarte');
    expect(screen.queryByLabelText('Add a comment')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Comments' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show discussion' }));
    expect(screen.getByRole('list', { name: 'Comments' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    expect(onReopen).toHaveBeenCalled();
  });
});
