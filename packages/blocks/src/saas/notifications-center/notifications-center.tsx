import {
  AtIcon,
  BellIcon,
  BellSlashIcon,
  CaretRightIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  CheckIcon,
  CreditCardIcon,
  EnvelopeSimpleIcon,
  GearSixIcon,
  InfoIcon,
  ShieldWarningIcon,
  UserFocusIcon,
  type Icon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import type { LinkTarget } from '../lib/auth';
import { Avatar } from '../lib/avatar';
import { Popover } from '../lib/popover';
import { formatDateTime, relativeTime } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
import { focusRing, touchTarget } from '../lib/styles';
import {
  unreadBadgeText,
  unreadNotificationCount,
  visibleNotifications,
  type AppNotification,
  type AppNotificationKind,
  type NotificationsFilter,
} from './notifications-center.logic';

export interface NotificationsCenterProps {
  notifications: readonly AppNotification[];
  /** Called when a notification is pressed; unread ones are marked read first. */
  onOpen?: ((notification: AppNotification) => void) | undefined;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  /** A link to the notification settings, at the foot of the list. */
  settings?: LinkTarget | undefined;
  /** Show the list in place, as a panel, instead of behind a bell button. */
  inline?: boolean;
  /** The moment relative times are measured from. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

const KIND_ICONS: Record<AppNotificationKind, Icon> = {
  mention: AtIcon,
  comment: ChatCircleTextIcon,
  assigned: UserFocusIcon,
  invite: EnvelopeSimpleIcon,
  billing: CreditCardIcon,
  security: ShieldWarningIcon,
  system: InfoIcon,
};

/**
 * The bell in an app's header: a count of what is unread, and behind it the list, newest first,
 * with All and Unread, mark one by opening it and mark all at once. With `inline` the same list
 * sits on the page as a panel. Read state lives in your app; the block calls you back.
 */
export function NotificationsCenter({
  inline = false,
  title = 'Notifications',
  className,
  ...props
}: NotificationsCenterProps) {
  const unread = unreadNotificationCount(props.notifications);
  if (inline) {
    return (
      <BlockPanel
        title={title}
        description={
          <span aria-live="polite">
            {props.notifications.length === 0 ? 'Nothing yet' : unreadText(unread)}
          </span>
        }
        actions={<MarkAllButton unread={unread} onMarkAllRead={props.onMarkAllRead} />}
        className={cn('overflow-clip', className)}
        bodyClassName="gap-3 px-0 pb-0"
      >
        <NotificationsBody {...props} inline />
      </BlockPanel>
    );
  }
  return (
    <Popover
      title={title}
      className={cn('w-96', className)}
      trigger={
        <button
          type="button"
          aria-label={unread === 0 ? title : `${title}, ${unreadText(unread)}`}
          className={cn(
            'relative inline-flex size-(--rx-button-height-md) cursor-pointer items-center justify-center rounded-(--rx-button-radius) text-fg-muted',
            'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
            'data-popup-open:bg-surface-hover data-popup-open:text-fg',
            focusRing,
            touchTarget,
          )}
        >
          <BellIcon aria-hidden weight="bold" className="size-5" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -end-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-xs font-medium text-accent-contrast numeric ring-2 ring-surface"
            >
              {unreadBadgeText(unread)}
            </span>
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
        {/* The popup is named by its own title; this line only shows it. */}
        <p aria-hidden className="font-display text-lg font-heading tracking-tight">
          {title}
        </p>
        <MarkAllButton unread={unread} onMarkAllRead={props.onMarkAllRead} />
      </div>
      <p role="status" className="sr-only">
        {unreadText(unread)}
      </p>
      <NotificationsBody {...props} />
    </Popover>
  );
}

function unreadText(count: number): string {
  if (count === 0) return 'All read';
  return `${String(count)} unread`;
}

function MarkAllButton({ unread, onMarkAllRead }: { unread: number; onMarkAllRead: () => void }) {
  const { Button } = useBlockParts();
  if (unread === 0) return null;
  return (
    <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
      <CheckIcon aria-hidden weight="bold" className="size-3.5" />
      Mark all as read
    </Button>
  );
}

function NotificationsBody({
  notifications,
  onOpen,
  onMarkRead,
  settings,
  now = new Date(),
  locale: requestedLocale,
  inline = false,
}: Omit<NotificationsCenterProps, 'title' | 'className' | 'onMarkAllRead'>) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const [filter, setFilter] = useState<NotificationsFilter>('all');
  const unread = unreadNotificationCount(notifications);
  const shown = visibleNotifications(notifications, filter);

  let content: ReactNode;
  if (shown.length === 0) {
    const none = notifications.length === 0;
    const EmptyIcon = none ? BellSlashIcon : CheckCircleIcon;
    content = (
      <div className="px-5 py-4">
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <EmptyIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              {none ? 'No notifications yet' : 'You are all caught up'}
            </span>
          }
        >
          {none
            ? 'You will hear here when someone mentions you, assigns you work or your plan changes.'
            : 'Every notification is read. Earlier ones stay under All.'}
          {!none && (
            <span className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilter('all');
                }}
              >
                Show all
              </Button>
            </span>
          )}
        </EmptyNote>
      </div>
    );
  } else {
    content = (
      <ul
        aria-label="Notifications"
        className={cn('flex flex-col', !inline && 'max-h-96 overflow-y-auto')}
      >
        <Items>
          {shown.map((notification) => (
            <Item key={notification.id} className="border-t border-line first:border-t-0">
              <NotificationRow
                notification={notification}
                now={now}
                locale={locale}
                onPress={() => {
                  if (!notification.read) onMarkRead(notification.id);
                  onOpen?.(notification);
                }}
              />
            </Item>
          ))}
        </Items>
      </ul>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      {notifications.length > 0 && (
        // Sticks under the panel title on a long page, so the filter stays in reach.
        <div className="sticky top-0 z-10 bg-surface px-5 pb-3">
          <Segmented
            label="Show"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', hint: unread },
            ]}
          />
        </div>
      )}
      <div className="border-t border-line">{content}</div>
      {settings !== undefined && <SettingsFooter to={settings} />}
    </div>
  );
}

/** The footer row to the notification settings: a full-width target, not a small link. */
function SettingsFooter({ to }: { to: LinkTarget }) {
  const classes = cn(
    'flex w-full cursor-pointer items-center gap-2.5 border-t border-line bg-surface-sunken px-5 py-3 text-start text-sm font-medium text-fg',
    'transition-colors duration-fast ease-standard hover:bg-surface-hover',
    '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  );
  const content = (
    <>
      <GearSixIcon aria-hidden weight="bold" className="size-4 text-fg-muted" />
      <span className="flex-1">Notification settings</span>
      <CaretRightIcon
        aria-hidden
        weight="bold"
        className="size-3.5 text-fg-subtle rtl:rotate-180"
      />
    </>
  );
  if (typeof to === 'string') {
    return (
      <a href={to} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={to} className={classes}>
      {content}
    </button>
  );
}

function NotificationRow({
  notification,
  now,
  locale,
  onPress,
}: {
  notification: AppNotification;
  now: Date;
  locale: string;
  onPress: () => void;
}) {
  const KindIcon = KIND_ICONS[notification.kind];
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        'flex w-full cursor-pointer gap-3 py-3 ps-1 pe-5 text-start',
        'transition-colors duration-fast ease-standard hover:bg-surface-hover',
        !notification.read && 'bg-surface-sunken',
        '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
      )}
    >
      {/* A gutter of its own for the unread dot, the same width on every row. */}
      <span aria-hidden className="flex w-4 shrink-0 justify-center pt-3">
        {!notification.read && <span className="size-2 rounded-full bg-accent" />}
      </span>
      <span className="relative inline-flex size-8 shrink-0">
        {notification.actor === undefined ? (
          <span
            aria-hidden
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-full bg-surface-sunken ring-1 ring-line-strong ring-inset',
              notification.kind === 'security' ? 'text-warning-strong' : 'text-fg-muted',
            )}
          >
            <KindIcon weight="bold" className="size-4" />
          </span>
        ) : (
          <Avatar name={notification.actor.name} src={notification.actor.avatarUrl} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm text-pretty text-fg">
          {!notification.read && <span className="sr-only">Unread, </span>}
          <NotificationTitle notification={notification} />
        </span>
        {notification.body !== undefined && (
          <span className="line-clamp-2 text-sm text-fg-muted">{notification.body}</span>
        )}
        <time
          dateTime={notification.at.toISOString()}
          title={formatDateTime(notification.at, locale)}
          className="text-xs text-fg-subtle"
        >
          {relativeTime(notification.at, now, locale)}
        </time>
      </span>
    </button>
  );
}

/** The lead carries the weight: the actor's name, or the whole title when no one sent it. */
function NotificationTitle({ notification }: { notification: AppNotification }) {
  const name = notification.actor?.name;
  if (name === undefined || !notification.title.startsWith(name)) {
    return notification.read ? (
      notification.title
    ) : (
      <span className="font-semibold">{notification.title}</span>
    );
  }
  return (
    <>
      <span className={notification.read ? 'font-medium' : 'font-semibold'}>{name}</span>
      {notification.title.slice(name.length)}
    </>
  );
}
