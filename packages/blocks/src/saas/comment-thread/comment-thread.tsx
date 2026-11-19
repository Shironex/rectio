import {
  ArrowBendUpLeftIcon,
  ArrowCounterClockwiseIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
  cn,
} from '@rectio/ui';
import { useState, useSyncExternalStore, type KeyboardEvent, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { ActionMenu } from '../lib/action-menu';
import { Avatar } from '../lib/avatar';
import { formatDateTime, plural, relativeTime } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
import {
  commentBodyError,
  commentSendModifier,
  commentParticipants,
  commentParts,
  commentTree,
  type CommentAuthor,
  type CommentThreadResolution,
  type ThreadComment,
} from './comment-thread.logic';

export interface CommentThreadProps {
  comments: readonly ThreadComment[];
  /** The person writing: their comments get Edit and Delete, and the composer shows them. */
  writer: CommentAuthor;
  /** Posts a comment, or a reply when `parentId` is given. Called with trimmed, valid text. */
  onAdd: (body: string, parentId?: string) => void;
  onEdit?: (commentId: string, body: string) => void;
  /** Asked to confirm first. */
  onDelete?: (commentId: string) => void;
  /** Set when the discussion is resolved: the composer gives way to a Reopen button. */
  resolved?: CommentThreadResolution | undefined;
  onResolve?: () => void;
  onReopen?: () => void;
  /** The moment comment times are measured from. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

/**
 * A discussion: comments oldest first with one level of replies, edit and delete for your own,
 * `@mentions` picked out, and a composer that sends with Ctrl or Cmd and Enter. A resolved thread
 * says who resolved it and when. The block holds only drafts; comments go to your callbacks.
 */
export function CommentThread({
  comments,
  writer,
  onAdd,
  onEdit,
  onDelete,
  resolved,
  onResolve,
  onReopen,
  now = new Date(),
  locale: requestedLocale,
  title = 'Discussion',
  className,
}: CommentThreadProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ThreadComment | null>(null);
  const tree = commentTree(comments);
  const people = commentParticipants(comments);

  const renderComment = (comment: ThreadComment, isReply: boolean) => {
    const own = comment.author.id === writer.id;
    const actions = [
      ...(own && onEdit !== undefined
        ? [
            {
              id: 'edit',
              label: 'Edit',
              icon: PencilSimpleIcon,
              onSelect: () => {
                setEditing(comment.id);
              },
            },
          ]
        : []),
      ...(own && onDelete !== undefined
        ? [
            {
              id: 'delete',
              label: 'Delete',
              icon: TrashIcon,
              danger: true,
              onSelect: () => {
                setDeleting(comment);
              },
            },
          ]
        : []),
    ];
    return (
      <article
        className="flex gap-3"
        aria-label={`${comment.author.name}, ${relativeTime(comment.createdAt, now, locale)}`}
      >
        <Avatar name={comment.author.name} src={comment.author.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <header className="flex items-start justify-between gap-2">
            <p className="flex flex-wrap items-baseline gap-x-2 text-base">
              <span className="font-medium text-fg">{comment.author.name}</span>
              {/* Time and the edited mark stay together on one line. */}
              <span className="whitespace-nowrap text-fg-muted">
                <time
                  dateTime={comment.createdAt.toISOString()}
                  title={formatDateTime(comment.createdAt, locale)}
                >
                  {relativeTime(comment.createdAt, now, locale)}
                </time>
                {comment.editedAt !== undefined && (
                  <span className="text-fg-subtle"> (edited)</span>
                )}
              </span>
            </p>
            {actions.length > 0 && editing !== comment.id && (
              <span className="-mt-1 -me-1">
                <ActionMenu
                  label={`Actions for your comment, ${relativeTime(comment.createdAt, now, locale)}`}
                  actions={actions}
                />
              </span>
            )}
          </header>
          {editing === comment.id ? (
            <Composer
              label="Edit comment"
              initial={comment.body}
              submitLabel="Save"
              onCancel={() => {
                setEditing(null);
              }}
              onSubmit={(body) => {
                onEdit?.(comment.id, body);
                setEditing(null);
              }}
            />
          ) : (
            <p className="text-base text-pretty whitespace-pre-line text-fg">
              {commentParts(comment.body).map((part, index) =>
                part.kind === 'mention' ? (
                  <span
                    key={index}
                    className="rounded-badge bg-accent-subtle px-0.5 font-medium text-accent-strong"
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={index}>{part.text}</span>
                ),
              )}
            </p>
          )}
          {!isReply &&
            resolved === undefined &&
            editing !== comment.id &&
            replyingTo !== comment.id && (
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ms-2 text-fg-muted"
                  aria-label={`Reply to ${comment.author.name}`}
                  onClick={() => {
                    setReplyingTo(comment.id);
                  }}
                >
                  <ArrowBendUpLeftIcon aria-hidden weight="bold" className="size-3.5" />
                  Reply
                </Button>
              </span>
            )}
        </div>
      </article>
    );
  };

  return (
    <BlockPanel
      title={title}
      description={
        comments.length === 0
          ? 'No comments yet'
          : `${plural(comments.length, 'comment')} from ${plural(people.length, 'person', 'people')}`
      }
      actions={
        resolved === undefined && onResolve !== undefined && comments.length > 0 ? (
          <Button variant="secondary" onClick={onResolve}>
            <CheckCircleIcon aria-hidden weight="bold" className="size-4" />
            Resolve
          </Button>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-5"
    >
      {resolved !== undefined && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-positive-strong/25 bg-positive-subtle px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2 text-positive-strong">
            <CheckCircleIcon aria-hidden weight="bold" className="size-4 shrink-0" />
            <span>
              <span className="font-medium">Resolved</span> by {resolved.by},{' '}
              {relativeTime(resolved.at, now, locale)}
            </span>
          </span>
          {onReopen !== undefined && (
            <Button variant="ghost" size="sm" onClick={onReopen}>
              <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
              Reopen
            </Button>
          )}
        </div>
      )}

      {comments.length === 0 ? (
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <ChatsCircleIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              Start the conversation
            </span>
          }
        >
          {resolved === undefined
            ? 'Ask a question or leave a note below; replies thread under it.'
            : 'This discussion was closed before anyone wrote.'}
        </EmptyNote>
      ) : (
        <ol
          aria-label="Comments"
          className={cn('flex flex-col gap-6', resolved !== undefined && 'opacity-80')}
        >
          <Items>
            {tree.map(({ comment, replies }) => (
              <Item key={comment.id} className="flex flex-col gap-4">
                {renderComment(comment, false)}
                {(replies.length > 0 || replyingTo === comment.id) && (
                  <ol
                    aria-label={`Replies to ${comment.author.name}`}
                    className="ms-4 flex flex-col gap-4 border-s-2 border-line-strong ps-6"
                  >
                    <Items>
                      {replies.map((reply) => (
                        <Item key={reply.id}>{renderComment(reply, true)}</Item>
                      ))}
                    </Items>
                    {replyingTo === comment.id && (
                      <li className="flex gap-3">
                        <Avatar name={writer.name} src={writer.avatarUrl} />
                        <div className="min-w-0 flex-1">
                          <Composer
                            label={`Reply to ${comment.author.name}`}
                            submitLabel="Reply"
                            autoFocus
                            onCancel={() => {
                              setReplyingTo(null);
                            }}
                            onSubmit={(body) => {
                              onAdd(body, comment.id);
                              setReplyingTo(null);
                            }}
                          />
                        </div>
                      </li>
                    )}
                  </ol>
                )}
              </Item>
            ))}
          </Items>
        </ol>
      )}

      {resolved === undefined && (
        <div className="flex gap-3 border-t border-line pt-5">
          <Avatar name={writer.name} src={writer.avatarUrl} />
          <div className="min-w-0 flex-1">
            <Composer
              label="Add a comment"
              submitLabel="Comment"
              placeholder="Write a comment. Use @ to mention someone."
              onSubmit={(body) => {
                onAdd(body);
              }}
            />
          </div>
        </div>
      )}

      <DeleteCommentDialog
        comment={deleting}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={(comment) => {
          onDelete?.(comment.id);
          setDeleting(null);
        }}
      />
    </BlockPanel>
  );
}

/**
 * A textarea with a send button. Ctrl or Cmd and Enter sends; Escape cancels when there is a
 * Cancel. The label stays for screen readers; the placeholder only hints.
 */
function Composer({
  label,
  submitLabel,
  initial = '',
  placeholder,
  autoFocus = false,
  onSubmit,
  onCancel,
}: {
  label: string;
  submitLabel: string;
  initial?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => void;
  onCancel?: () => void;
}) {
  const { Button } = useBlockParts();
  const modifier = useSendModifier();
  const [body, setBody] = useState(initial);
  const [tried, setTried] = useState(false);
  const error = tried ? commentBodyError(body) : null;

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault();
    setTried(true);
    if (commentBodyError(body) !== null) return;
    onSubmit(body.trim());
    setBody('');
    setTried(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit();
    if (event.key === 'Escape' && onCancel !== undefined) {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <Field invalid={error !== null}>
        <FieldLabel className="sr-only">{label}</FieldLabel>
        <Input
          render={<textarea rows={initial === '' ? 2 : 3} />}
          autoFocus={autoFocus}
          value={body}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          onChange={(event) => {
            setBody(event.target.value);
          }}
          className="h-auto min-h-16 resize-y py-2 leading-normal pointer-coarse:h-auto"
        />
        {error !== null && <FieldError>{error}</FieldError>}
      </Field>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="me-auto hidden text-sm text-fg-subtle pointer-fine:inline">
          <kbd className="font-sans">{modifier}</kbd> and <kbd className="font-sans">Enter</kbd> to
          send
        </span>
        {onCancel !== undefined && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm">
          {submitLabel === 'Comment' && (
            <ChatsCircleIcon aria-hidden weight="bold" className="size-3.5" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function DeleteCommentDialog({
  comment,
  onCancel,
  onConfirm,
}: {
  comment: ThreadComment | null;
  onCancel: () => void;
  onConfirm: (comment: ThreadComment) => void;
}) {
  const { Button } = useBlockParts();
  const [shown, setShown] = useState(comment);
  if (comment !== null && comment !== shown) setShown(comment);
  return (
    <Dialog
      open={comment !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this comment?</DialogTitle>
          <DialogDescription>
            {shown !== null && shown.body.length > 0
              ? `"${shown.body.length > 80 ? `${shown.body.slice(0, 80)}...` : shown.body}" is removed for everyone. Replies to it stay.`
              : 'It is removed for everyone.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (shown !== null) onConfirm(shown);
            }}
          >
            Delete comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const noSubscription = () => () => undefined;

/** Cmd on Apple devices, Ctrl elsewhere and while rendering on the server or in tests. */
function useSendModifier() {
  return useSyncExternalStore(
    noSubscription,
    () => {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      return commentSendModifier(nav.userAgentData?.platform ?? nav.platform);
    },
    () => 'Ctrl' as const,
  );
}
