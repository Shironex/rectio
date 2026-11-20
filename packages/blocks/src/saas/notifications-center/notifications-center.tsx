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
import { EmptyState, cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import type { LinkTarget } from '../lib/auth';
import { Avatar } from '../lib/avatar';
import { Popover } from '../lib/popover';
import { useNow } from '../lib/focus';
import { formatDateTime, isoDateTime, relativeTime } from '../lib/saas';
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
        actions={
          <MarkAllButton
            total={props.notifications.length}
            unread={unread}
            onMarkAllRead={props.onMarkAllRead}
          />
        }
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
        <MarkAllButton
          total={props.notifications.length}
          unread={unread}
          onMarkAllRead={props.onMarkAllRead}
        />
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

function MarkAllButton({
  total,
  unread,
  onMarkAllRead,
}: {
  total: number;
  unread: number;
  onMarkAllRead: () => void;
}) {
  const { Button } = useBlockParts();
  if (total === 0) return null;
  // Stays mounted when all is read, disabled but focusable, so focus has somewhere to stay.
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={unread === 0}
      focusableWhenDisabled
      onClick={onMarkAllRead}
    >
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
  now: requestedNow,
  locale: requestedLocale,
  inline = false,
}: Omit<NotificationsCenterProps, 'title' | 'className' | 'onMarkAllRead'>) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
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
      // The panel is already a surface, so the empty state sits in it without a box of its own.
      <EmptyState
        role="status"
        size="sm"
        icon={<EmptyIcon aria-hidden weight="duotone" />}
        title={none ? 'No notifications yet' : 'You are all caught up'}
        description={
          none
            ? 'You will hear here when someone mentions you, assigns you work or your plan changes.'
            : 'Every notification is read. Earlier ones stay under All.'
        }
        actions={
          none ? undefined : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilter('all');
              }}
            >
              Show all
            </Button>
          )
        }
      />
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
    'flex w-full cursor-pointer items-center gap-2.5 border-t border-line px-5 py-3 text-start text-sm font-medium text-fg',
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
        'flex w-full cursor-pointer gap-3 px-5 py-3 text-start',
        'transition-colors duration-fast ease-standard hover:bg-surface-hover',
        !notification.read && 'bg-accent-subtle/40',
        '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
      )}
    >
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
        {/* Unread: the dot, a strong lead and full text colour. Read: regular weight, muted. */}
        <span className={cn('text-sm', notification.read ? 'text-fg-muted' : 'text-fg')}>
          {!notification.read && <span className="sr-only">Unread, </span>}
          <NotificationTitle notification={notification} />
        </span>
        {notification.body !== undefined && (
          <span className="line-clamp-2 text-sm text-fg-muted">{notification.body}</span>
        )}
        {/* The meta line: the unread dot beside the moment, said once by the title's prefix. */}
        <span className="flex items-center gap-1.5 text-xs text-fg-muted">
          {!notification.read && <span aria-hidden className="size-2 rounded-full bg-accent" />}
          <time
            dateTime={isoDateTime(notification.at)}
            title={formatDateTime(notification.at, locale)}
          >
            {relativeTime(notification.at, now, locale)}
          </time>
        </span>
      </span>
    </button>
  );
}

/**
 * An unread title leads with weight: the actor's name, or the whole title when no one sent it. A
 * read title stays at regular weight throughout.
 */
function NotificationTitle({ notification }: { notification: AppNotification }) {
  if (notification.read) return notification.title;
  const name = notification.actor?.name;
  if (name === undefined || !notification.title.startsWith(name)) {
    return <span className="font-strong">{notification.title}</span>;
  }
  return (
    <>
      <span className="font-strong">{name}</span>
      {notification.title.slice(name.length)}
    </>
  );
}
