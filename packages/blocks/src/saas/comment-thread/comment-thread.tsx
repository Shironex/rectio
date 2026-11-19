import {
  ArrowBendUpLeftIcon,
  ArrowCounterClockwiseIcon,
  ChatsCircleIcon,
  CaretDownIcon,
  CheckCircleIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
  type Icon,
} from '@phosphor-icons/react';
import {
  Badge,
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
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { ActionMenu } from '../lib/action-menu';
import { Avatar } from '../lib/avatar';
import { focusFirstInvalid, useNow } from '../lib/focus';
import { formatDateTime, isoDateTime, plural, relativeTime } from '../lib/saas';
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
  /** Adds Copy link to every comment's menu, so each comment has the same menu. */
  onCopyLink?: (commentId: string) => void;
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
  onCopyLink,
  resolved,
  onResolve,
  onReopen,
  now: requestedNow,
  locale: requestedLocale,
  title = 'Discussion',
  className,
}: CommentThreadProps) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);
  // When an in-place composer closes, focus goes back to what opened it: the comment's menu after
  // an edit, its Reply button after a reply. The opener is found again once it has re-rendered.
  const returnFocus = useRef<string | null>(null);
  const stopEditing = () => {
    if (editing !== null) {
      returnFocus.current = `[data-comment-menu="${CSS.escape(editing)}"] button`;
    }
    setEditing(null);
  };
  const stopReplying = () => {
    if (replyingTo !== null) {
      returnFocus.current = `[data-reply-for="${CSS.escape(replyingTo)}"]`;
    }
    setReplyingTo(null);
  };

  useEffect(() => {
    const selector = returnFocus.current;
    if (selector === null) return;
    returnFocus.current = null;
    list.current?.querySelector<HTMLElement>(selector)?.focus();
  }, [editing, replyingTo]);
  const [deleting, setDeleting] = useState<ThreadComment | null>(null);
  // A resolved discussion folds behind its banner until asked for.
  const [showResolved, setShowResolved] = useState(false);
  const listId = useId();
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
      ...(onCopyLink === undefined
        ? []
        : [
            {
              id: 'link',
              label: 'Copy link',
              icon: LinkSimpleIcon,
              onSelect: () => {
                onCopyLink(comment.id);
              },
            },
          ]),
    ];
    const when = relativeTime(comment.createdAt, now, locale);
    return (
      <article
        className="group/comment flex gap-3"
        aria-label={`${comment.author.name}, ${relativeTime(comment.createdAt, now, locale)}`}
      >
        <Avatar name={comment.author.name} src={comment.author.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <header className="flex items-start justify-between gap-2">
            <p className="flex flex-wrap items-baseline gap-x-2 text-base">
              <span className="font-medium text-fg">{comment.author.name}</span>
              {comment.author.role !== undefined && (
                <Badge className="self-center">{comment.author.role}</Badge>
              )}
              {/* Time and the edited mark stay together on one line. */}
              <span className="whitespace-nowrap text-fg-muted">
                <time
                  dateTime={isoDateTime(comment.createdAt)}
                  title={formatDateTime(comment.createdAt, locale)}
                >
                  {relativeTime(comment.createdAt, now, locale)}
                </time>
                {comment.editedAt !== undefined && (
                  <span
                    className="text-sm text-fg-subtle"
                    title={`Edited ${formatDateTime(comment.editedAt, locale)}`}
                  >
                    {' '}
                    · edited
                  </span>
                )}
              </span>
            </p>
            {actions.length > 0 && editing !== comment.id && (
              <span
                className={cn(
                  '-mt-1 -me-1 transition-opacity duration-fast ease-standard',
                  // Fine pointers reveal the menu on hover or focus; touch keeps it in view.
                  'pointer-fine:opacity-0 pointer-fine:group-focus-within/comment:opacity-100 pointer-fine:group-hover/comment:opacity-100 pointer-fine:has-data-popup-open:opacity-100',
                )}
                data-comment-menu={comment.id}
              >
                <ActionMenu
                  label={
                    own
                      ? `Actions for your comment, ${when}`
                      : `Actions for the comment by ${comment.author.name}, ${when}`
                  }
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
              autoFocus
              onCancel={stopEditing}
              onSubmit={(body) => {
                onEdit?.(comment.id, body);
                stopEditing();
              }}
            />
          ) : (
            <p className="max-w-prose text-base text-pretty whitespace-pre-line text-fg">
              {commentParts(comment.body).map((part, index) =>
                part.kind === 'mention' ? (
                  <span
                    key={index}
                    className="font-medium text-accent-strong underline decoration-accent/40 underline-offset-2"
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
                  aria-label={`Reply, ${comment.author.name}`}
                  data-reply-for={comment.id}
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
              {comments.length > 0 && (
                <span className="text-fg-muted">, {plural(comments.length, 'comment')}</span>
              )}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            {comments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={showResolved}
                aria-controls={listId}
                onClick={() => {
                  setShowResolved(!showResolved);
                }}
              >
                <CaretDownIcon
                  aria-hidden
                  weight="bold"
                  className={cn(
                    'size-3.5 transition-transform duration-fast ease-standard',
                    showResolved && 'rotate-180',
                  )}
                />
                {showResolved ? 'Hide discussion' : 'Show discussion'}
              </Button>
            )}
            {onReopen !== undefined && (
              <Button variant="ghost" size="sm" onClick={onReopen}>
                <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
                Reopen
              </Button>
            )}
          </span>
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
          id={listId}
          aria-label="Comments"
          ref={list}
          hidden={resolved !== undefined && !showResolved}
          className="flex flex-col gap-6"
        >
          <Items>
            {tree.map(({ comment, replies }) => (
              <Item key={comment.id} className="flex flex-col gap-4">
                {renderComment(comment, false)}
                {(replies.length > 0 || replyingTo === comment.id) && (
                  <ol
                    aria-label={`Replies to ${comment.author.name}`}
                    className="ms-4 flex flex-col gap-4 border-s border-line ps-6"
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
                            onCancel={stopReplying}
                            onSubmit={(body) => {
                              onAdd(body, comment.id);
                              stopReplying();
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
              icon={ChatsCircleIcon}
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
  icon: SubmitIcon,
  onSubmit,
  onCancel,
}: {
  label: string;
  submitLabel: string;
  /** Drawn before the submit label. */
  icon?: Icon;
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
  const form = useRef<HTMLFormElement>(null);
  const error = tried ? commentBodyError(body) : null;

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault();
    setTried(true);
    if (commentBodyError(body) !== null) {
      focusFirstInvalid(form.current);
      return;
    }
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
    <form ref={form} onSubmit={submit} noValidate className="flex flex-col gap-2">
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
          className="field-sizing-content h-auto max-h-64 min-h-16 resize-none overflow-y-auto py-2 leading-normal pointer-coarse:h-auto"
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
          {SubmitIcon !== undefined && (
            <SubmitIcon aria-hidden weight="bold" className="size-3.5" />
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
