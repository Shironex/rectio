'use client';

import {
  DotsThreeIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  PushPinIcon,
  PushPinSlashIcon,
  SidebarSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Anchor,
  Button,
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  SearchInput,
  Sheet,
  SheetContent,
  SheetTitle,
  SkeletonLine,
  cn,
  touchHitArea,
} from '@rectio/ui';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import {
  AiChatThread,
  type AiChatThreadMessages,
  type AiChatThreadProps,
} from '../chat-thread/chat-thread';
import { CHAT_WORKSPACE_MESSAGES, type ChatWorkspaceMessages } from './chat-workspace-messages';
import {
  MAX_CHAT_TITLE,
  cleanTitle,
  filterChats,
  focusAfterRemoval,
  groupChats,
  type AiChatSummary,
} from './chat-workspace.logic';

/** What the list of chats does with the reader's choices. */
export interface AiChatListProps {
  chats: readonly AiChatSummary[];
  /** The chat open in the thread, marked as the current page. */
  activeId?: string | null | undefined;
  /** Opens a chat. Called for links too, before your router follows them. */
  onSelect?: ((chat: AiChatSummary) => void) | undefined;
  /** Makes each row a link to its chat, through the LinkProvider when there is one. */
  chatHref?: ((chat: AiChatSummary) => string) | undefined;
  onNewChat?: (() => void) | undefined;
  /** Renames a chat; the rename item shows only with this. */
  onRename?: ((chat: AiChatSummary, title: string) => void) | undefined;
  /** Deletes a chat after the reader confirms; the delete item shows only with this. */
  onDelete?: ((chat: AiChatSummary) => void) | undefined;
  /** Pins or unpins a chat; the pin item shows only with this. */
  onPinChange?: ((chat: AiChatSummary, pinned: boolean) => void) | undefined;
  /** While the chats load: rows of placeholders. */
  loading?: boolean | undefined;
  /** Today, for the date groups. Defaults to now. */
  now?: Date | undefined;
  /** Under the list: the account, settings. */
  footer?: ReactNode;
  messages?: Partial<ChatWorkspaceMessages> | undefined;
  className?: string | undefined;
}

export interface ChatWorkspaceProps
  extends
    Omit<AiChatThreadProps, 'header' | 'messages' | 'className' | 'now'>,
    Omit<AiChatListProps, 'messages' | 'className' | 'loading' | 'footer'> {
  /** While the chats load. */
  chatsLoading?: boolean | undefined;
  /** While the open chat's messages load: placeholders in the thread, and the field waits. */
  threadLoading?: boolean | undefined;
  /** The thread's title; the open chat's title by default. */
  title?: ReactNode;
  /** At the end of the thread's title bar: share, export, a model badge. */
  headerActions?: ReactNode;
  /** Under the list: the account, settings. */
  listFooter?: ReactNode;
  messages?: Partial<ChatWorkspaceMessages> | undefined;
  threadMessages?: Partial<AiChatThreadMessages> | undefined;
  className?: string | undefined;
}

/** Says a text after it stays the same for a moment, so typing a search is heard once. */
function useSettled(text: string) {
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(text);
    }, 700);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);
  return settled;
}

const rowClass = cn(
  'flex h-(--rx-sidebar-item-height) w-full min-w-0 cursor-pointer items-center rounded-control ps-2 pe-9',
  'text-sm text-fg-muted no-underline select-none',
  'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:pe-12',
  'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
  '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'data-current:bg-(--rx-sidebar-item-active) data-current:font-medium data-current:text-fg',
);

interface RowProps {
  chat: AiChatSummary;
  title: string;
  active: boolean;
  renaming: boolean;
  m: ChatWorkspaceMessages;
  href: string | undefined;
  register: (id: string, element: HTMLElement | null) => void;
  onOpen: () => void;
  onStartRename: (() => void) | undefined;
  onEndRename: (title: string | null) => void;
  onPin: (() => void) | undefined;
  onAskDelete: (() => void) | undefined;
}

function RenameField({
  title,
  label,
  onEnd,
}: {
  title: string;
  label: string;
  onEnd: (title: string | null) => void;
}) {
  const [text, setText] = useState(title);
  const done = useRef(false);
  const end = (value: string | null) => {
    if (done.current) return;
    done.current = true;
    onEnd(value);
  };
  return (
    <input
      // The field replaces the row the reader chose to rename, so it takes the focus at once.
      autoFocus
      aria-label={label}
      value={text}
      maxLength={MAX_CHAT_TITLE * 2}
      onFocus={(event) => {
        event.currentTarget.select();
      }}
      onChange={(event) => {
        setText(event.currentTarget.value);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          end(text);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          end(null);
        }
      }}
      onBlur={() => {
        end(text);
      }}
      className={cn(
        'h-(--rx-sidebar-item-height) w-full min-w-0 rounded-control border border-fg-subtle bg-surface px-2 text-sm text-fg',
        'pointer-coarse:h-(--rx-control-height-touch)',
        'outline-offset-0 focus-visible:outline-2 focus-visible:outline-focus',
      )}
    />
  );
}

function ChatRow({
  chat,
  title,
  active,
  renaming,
  m,
  href,
  register,
  onOpen,
  onStartRename,
  onEndRename,
  onPin,
  onAskDelete,
}: RowProps) {
  if (renaming) {
    return (
      <li className="flex">
        <RenameField title={title} label={m.renameField} onEnd={onEndRename} />
      </li>
    );
  }
  const hasMenu = onStartRename !== undefined || onPin !== undefined || onAskDelete !== undefined;
  const common = {
    ref: (element: HTMLElement | null) => {
      register(chat.id, element);
    },
    'aria-current': active ? ('page' as const) : undefined,
    'data-current': active ? '' : undefined,
    'data-chat-id': chat.id,
    className: rowClass,
    onClick: onOpen,
  };
  const label = <span className="min-w-0 flex-1 truncate text-start">{title}</span>;
  return (
    <li className="group/row relative flex">
      {href === undefined ? (
        <button type="button" {...common}>
          {label}
        </button>
      ) : (
        <Anchor href={href} {...common}>
          {label}
        </Anchor>
      )}
      {hasMenu && (
        <Menu>
          <MenuTrigger
            aria-label={m.more(title)}
            className={cn(
              'absolute end-1 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-fg-subtle',
              'transition-[opacity,background-color,color] duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
              'outline-offset-0 focus-visible:outline-2 focus-visible:outline-focus',
              // Shown on hover and focus with a mouse; always there on a touch screen.
              'opacity-0 group-hover/row:opacity-100 group-has-data-current/row:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100',
              'pointer-coarse:end-0 pointer-coarse:opacity-100',
              touchHitArea,
            )}
          >
            <DotsThreeIcon aria-hidden weight="bold" className="size-4" />
          </MenuTrigger>
          <MenuContent align="end">
            {onStartRename !== undefined && (
              <MenuItem
                icon={<PencilSimpleIcon aria-hidden weight="bold" />}
                onClick={onStartRename}
              >
                {m.rename}
              </MenuItem>
            )}
            {onPin !== undefined && (
              <MenuItem
                icon={
                  chat.pinned === true ? (
                    <PushPinSlashIcon aria-hidden weight="bold" />
                  ) : (
                    <PushPinIcon aria-hidden weight="bold" />
                  )
                }
                onClick={onPin}
              >
                {chat.pinned === true ? m.unpin : m.pin}
              </MenuItem>
            )}
            {onAskDelete !== undefined && (
              <>
                {(onStartRename !== undefined || onPin !== undefined) && <MenuSeparator />}
                <MenuItem
                  tone="danger"
                  icon={<TrashIcon aria-hidden weight="bold" />}
                  onClick={onAskDelete}
                >
                  {m.delete}
                </MenuItem>
              </>
            )}
          </MenuContent>
        </Menu>
      )}
    </li>
  );
}

/**
 * The list of chats on its own: New chat, a search, then pinned chats and the rest by date, each
 * with a menu to rename in place, pin and delete after a confirmation. Focus never gets lost: a
 * rename returns it to its row, and a delete moves it to the next chat, else New chat.
 */
export function AiChatList({
  chats,
  activeId,
  onSelect,
  chatHref,
  onNewChat,
  onRename,
  onDelete,
  onPinChange,
  loading = false,
  now,
  footer,
  messages: overrides,
  className,
}: AiChatListProps) {
  const m = { ...CHAT_WORKSPACE_MESSAGES, ...overrides };
  const [query, setQuery] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AiChatSummary | null>(null);
  /** The row to focus once the list has drawn again, such as after a rename. */
  const focusRequest = useRef<string | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());
  const newChat = useRef<HTMLButtonElement | null>(null);
  /** Where focus lands once the delete dialog closes after a delete. */
  const afterDelete = useRef<HTMLElement | null>(null);
  const headingId = useId();

  const visible = filterChats(chats, query);
  const groups = groupChats(visible, now ?? new Date());
  const ids = groups.flatMap((group) => group.chats.map((chat) => chat.id));
  const searching = query.trim() !== '';
  const announcement = useSettled(searching && !loading ? m.results(visible.length) : '');
  const titleOf = (chat: AiChatSummary) => (chat.title.trim() === '' ? m.untitled : chat.title);

  useLayoutEffect(() => {
    const id = focusRequest.current;
    if (id === null) return;
    focusRequest.current = null;
    rows.current.get(id)?.focus();
  });

  const register = (id: string, element: HTMLElement | null) => {
    if (element === null) rows.current.delete(id);
    else rows.current.set(id, element);
  };

  return (
    <div
      data-slot="ai-chat-list"
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      aria-busy={loading || undefined}
    >
      <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
        <h2 id={headingId} className="sr-only">
          {m.chats}
        </h2>
        {onNewChat !== undefined && (
          <Button ref={newChat} variant="secondary" className="w-full" onClick={onNewChat}>
            <NotePencilIcon aria-hidden weight="bold" className="size-4" />
            {m.newChat}
          </Button>
        )}
        <SearchInput
          aria-label={m.search}
          placeholder={m.search}
          value={query}
          onValueChange={setQuery}
          clearLabel={m.clearSearch}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pt-1 pb-3">
        {loading ? (
          <div className="flex flex-col gap-1">
            <span className="sr-only">{m.loadingChats}</span>
            {[72, 56, 84, 64, 48, 76].map((width, index) => (
              <div
                key={width}
                className="flex h-(--rx-sidebar-item-height) items-center px-2 pointer-coarse:h-(--rx-control-height-touch)"
              >
                <SkeletonLine size="sm" width={`${width}%`} index={index} />
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <EmptyState
            size="sm"
            title={m.emptyTitle}
            description={m.emptyDescription}
            className="my-auto"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            size="sm"
            title={m.noMatches(query.trim())}
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                }}
              >
                {m.clearSearch}
              </Button>
            }
          />
        ) : (
          groups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`${headingId}-${group.key}`}
              className="flex flex-col gap-0.5"
            >
              <h3
                id={`${headingId}-${group.key}`}
                className="px-2 pb-1 text-xs font-medium tracking-caps text-fg-subtle uppercase select-none"
              >
                {m.groups[group.key]}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {group.chats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    title={titleOf(chat)}
                    active={chat.id === activeId}
                    renaming={renaming === chat.id}
                    m={m}
                    href={chatHref?.(chat)}
                    register={register}
                    onOpen={() => {
                      onSelect?.(chat);
                    }}
                    onStartRename={
                      onRename === undefined
                        ? undefined
                        : () => {
                            setRenaming(chat.id);
                          }
                    }
                    onEndRename={(typed) => {
                      focusRequest.current = chat.id;
                      setRenaming(null);
                      const title = typed === null ? null : cleanTitle(typed, chat.title);
                      if (title !== null) onRename?.(chat, title);
                    }}
                    onPin={
                      onPinChange === undefined
                        ? undefined
                        : () => {
                            onPinChange(chat, chat.pinned !== true);
                          }
                    }
                    onAskDelete={
                      onDelete === undefined
                        ? undefined
                        : () => {
                            setDeleting(chat);
                          }
                    }
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
      {footer !== undefined && footer !== null && (
        <div className="border-t border-line px-3 py-2">{footer}</div>
      )}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent
          // After a delete the row is gone: focus goes to the next chat, else New chat.
          finalFocus={() => {
            const target = afterDelete.current;
            afterDelete.current = null;
            return target ?? true;
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{m.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting === null ? '' : m.deleteDescription(titleOf(deleting))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onAction={() => {
                if (deleting === null) return;
                const next = focusAfterRemoval(ids, deleting.id);
                afterDelete.current =
                  (next === null ? undefined : rows.current.get(next)) ?? newChat.current;
                onDelete?.(deleting);
              }}
            >
              {m.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Placeholder turns while a chat's messages load. */
function ThreadSkeleton({ label }: { label: string }) {
  return (
    <div data-part="thread-loading" aria-busy className="flex flex-col gap-8 py-6">
      <span className="sr-only">{label}</span>
      <div className="flex justify-end">
        <SkeletonLine width="w-56" size="lg" className="h-10 rounded-panel" />
      </div>
      <div className="flex flex-col gap-2.5">
        <SkeletonLine width="11/12" index={1} />
        <SkeletonLine width="full" index={2} />
        <SkeletonLine width="2/3" index={3} />
      </div>
      <div className="flex justify-end">
        <SkeletonLine width="w-40" size="lg" index={4} className="h-10 rounded-panel" />
      </div>
      <div className="flex flex-col gap-2.5">
        <SkeletonLine width="full" index={5} />
        <SkeletonLine width="3/4" index={6} />
      </div>
    </div>
  );
}

/**
 * A full chat page: the list of chats beside the open conversation. The list has New chat, a
 * search, pinned chats and the rest by date, with rename, pin and delete; the conversation is the
 * AI chat thread with a title bar. Below the medium breakpoint the list moves into a sheet opened
 * from the title bar, and picking a chat closes it and puts the focus in the message field.
 * Provider agnostic: chats, the conversation and every action are props.
 */
export function ChatWorkspace({
  chats,
  activeId,
  onSelect,
  chatHref,
  onNewChat,
  onRename,
  onDelete,
  onPinChange,
  chatsLoading = false,
  threadLoading = false,
  title,
  headerActions,
  listFooter,
  now,
  messages: overrides,
  threadMessages,
  className,
  conversation,
  composer,
  renderComposer,
  ...thread
}: ChatWorkspaceProps) {
  const m = { ...CHAT_WORKSPACE_MESSAGES, ...overrides };
  const [listOpen, setListOpen] = useState(false);
  const threadRoot = useRef<HTMLDivElement | null>(null);
  /** True when the sheet closes because a chat was picked: focus goes to the field, not the trigger. */
  const picked = useRef(false);
  const active = chats.find((chat) => chat.id === activeId);
  const heading =
    title ?? (active === undefined ? null : active.title.trim() === '' ? m.untitled : active.title);

  const listProps: AiChatListProps = {
    chats,
    activeId,
    chatHref,
    onRename,
    onDelete,
    onPinChange,
    loading: chatsLoading,
    now,
    footer: listFooter,
    messages: overrides,
  };

  return (
    <div data-slot="chat-workspace" className={cn('flex min-h-0 bg-surface', className)}>
      <nav
        aria-label={m.chats}
        className="flex w-(--rx-sidebar-width) shrink-0 flex-col border-e border-line bg-(--rx-sidebar-background) max-md:hidden"
      >
        <AiChatList {...listProps} onSelect={onSelect} onNewChat={onNewChat} />
      </nav>
      <Sheet side="left" open={listOpen} onOpenChange={setListOpen}>
        <SheetContent
          size="sm"
          closeLabel={m.closeChats}
          className="w-(--rx-sidebar-width) bg-(--rx-sidebar-background)"
          finalFocus={() => {
            if (!picked.current) return true;
            picked.current = false;
            return threadRoot.current?.querySelector('textarea') ?? true;
          }}
        >
          <SheetTitle className="sr-only">{m.chats}</SheetTitle>
          <nav aria-label={m.chats} className="flex min-h-0 flex-1 flex-col pt-10">
            <AiChatList
              {...listProps}
              onSelect={(chat) => {
                picked.current = true;
                setListOpen(false);
                onSelect?.(chat);
              }}
              onNewChat={
                onNewChat === undefined
                  ? undefined
                  : () => {
                      picked.current = true;
                      setListOpen(false);
                      onNewChat();
                    }
              }
            />
          </nav>
        </SheetContent>
      </Sheet>
      <div ref={threadRoot} className="flex min-w-0 flex-1 flex-col">
        <AiChatThread
          {...thread}
          className="min-h-0 flex-1"
          now={now}
          messages={threadMessages}
          conversation={threadLoading ? [] : conversation}
          empty={threadLoading ? <ThreadSkeleton label={m.loadingThread} /> : thread.empty}
          composer={threadLoading ? { ...composer, disabled: true } : composer}
          renderComposer={renderComposer}
          header={
            <header className="flex h-(--rx-app-shell-header-height) shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4">
              <button
                type="button"
                aria-label={m.openChats}
                aria-haspopup="dialog"
                aria-expanded={listOpen}
                onClick={() => {
                  setListOpen(true);
                }}
                className={cn(
                  'relative inline-flex size-(--rx-button-height-md) shrink-0 cursor-pointer items-center justify-center md:hidden',
                  'rounded-(--rx-button-radius) text-fg-muted hover:bg-surface-hover hover:text-fg',
                  'transition-colors duration-fast ease-standard',
                  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                  touchHitArea,
                )}
              >
                <SidebarSimpleIcon
                  aria-hidden
                  weight="bold"
                  className="size-4.5 rtl:-scale-x-100"
                />
              </button>
              <h2 className="min-w-0 flex-1 truncate text-sm font-heading text-fg">{heading}</h2>
              <div className="flex shrink-0 items-center gap-1 pointer-coarse:gap-touch-gap">
                {headerActions}
                {onNewChat !== undefined && (
                  <Button
                    variant="ghost"
                    iconOnly
                    aria-label={m.newChat}
                    className="relative md:hidden"
                    onClick={onNewChat}
                  >
                    <NotePencilIcon aria-hidden weight="bold" className="size-4.5" />
                  </Button>
                )}
              </div>
            </header>
          }
        />
      </div>
    </div>
  );
}
