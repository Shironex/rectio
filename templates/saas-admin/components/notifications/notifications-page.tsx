'use client';

import { NotificationsCenter } from '@rectio/blocks/motion';
import { useRouter } from 'next/navigation';

import { LOCALE, NOW } from '@/data/workspace';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

/** Every notification in one list: the bell in the header shows the same, shorter. */
export function NotificationsPage() {
  const state = usePageState();
  const router = useRouter();
  const { notifications, markRead, markAllRead, openTicket } = useAppData();
  const shown = state === 'empty' ? [] : notifications;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Assignments, mentions, billing and security, newest first"
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading notifications">
          <LoadingPanel kind="list" rows={6} tabs={2} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Notifications did not load" />
      ) : (
        <NotificationsCenter
          inline
          title="Inbox"
          notifications={shown}
          now={NOW}
          locale={LOCALE}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onOpen={(n) => {
            const reference = /CPL-(\d+)/.exec(n.title)?.[1];
            if (reference !== undefined) openTicket(`cpl-${reference}`);
            else if (n.kind === 'billing') router.push('/billing');
            else if (n.kind === 'invite') router.push('/team');
            else if (n.kind === 'security') router.push('/settings/security');
          }}
          settings={() => {
            router.push('/settings/notifications');
          }}
        />
      )}
    </>
  );
}
