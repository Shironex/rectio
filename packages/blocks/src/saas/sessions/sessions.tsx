import {
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  DevicesIcon,
  LaptopIcon,
  SignOutIcon,
  type Icon,
} from '@phosphor-icons/react';
import {
  Anchor,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@rectio/ui';
import { useRef, useState, type ReactNode } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { useNow, useRemovalFocus } from '../lib/focus';
import { countLabel, formatDateTime, isoDateTime, relativeTime } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
import { inlineLink } from '../lib/styles';
import {
  isActiveNow,
  otherSessions,
  sessionName,
  sortSessions,
  type Session,
  type SessionDevice,
} from './sessions.logic';

export interface SessionsProps {
  sessions: readonly Session[];
  /** Signs one session out at once: it is easy to sign in again, so there is no dialog. */
  onRevoke?: (sessionId: string) => void;
  /** Signs out every session but this one, after a confirm. */
  onRevokeOthers?: () => void;
  /** Ids being signed out: their buttons show progress until the session leaves the list. */
  revoking?: readonly string[];
  /** Where the reader changes their password, linked from the note under the list. */
  passwordHref?: string;
  /** Why the last sign out failed, shown above the list. */
  error?: ReactNode;
  /** The moment "last active" is measured from. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

const DEVICE_ICON: Record<SessionDevice, Icon> = {
  desktop: DesktopIcon,
  laptop: LaptopIcon,
  phone: DeviceMobileIcon,
  tablet: DeviceTabletIcon,
  unknown: DevicesIcon,
};

const DEVICE_NAME: Record<SessionDevice, string> = {
  desktop: 'Desktop',
  laptop: 'Laptop',
  phone: 'Phone',
  tablet: 'Tablet',
  unknown: 'Device',
};

/**
 * Where the account is signed in: each session's device, browser, place and last activity, this
 * device marked and first. Any other session signs out in one press, all of them after a confirm,
 * and focus stays in the list as rows leave.
 */
export function Sessions({
  sessions,
  onRevoke,
  onRevokeOthers,
  revoking = [],
  passwordHref,
  error,
  now: requestedNow,
  locale: requestedLocale,
  title = 'Sessions',
  className,
}: SessionsProps) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const [confirming, setConfirming] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const sorted = sortSessions(sessions);
  const others = otherSessions(sorted);
  const removal = useRemovalFocus(
    panel,
    sorted.map((session) => session.id),
  );

  return (
    <BlockPanel
      ref={panel}
      title={title}
      description={
        sessions.length === 0
          ? 'Not signed in anywhere'
          : others.length === 0
            ? 'Signed in on this device only'
            : `Signed in on ${countLabel(sessions.length, 'device')}`
      }
      actions={
        onRevokeOthers !== undefined && others.length > 0 ? (
          <Button
            variant="secondary"
            onClick={() => {
              setConfirming(true);
            }}
          >
            <SignOutIcon aria-hidden weight="bold" className="size-4" />
            Sign out other sessions
          </Button>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-4"
    >
      {error !== undefined && error !== null && (
        <p
          role="alert"
          className="rounded-control border border-negative-strong/30 bg-negative-subtle px-3 py-2 text-sm text-negative-strong"
        >
          {error}
        </p>
      )}
      {sorted.length === 0 ? (
        <EmptyNote title="No active sessions" icon={DevicesIcon}>
          Devices you sign in on appear here.
        </EmptyNote>
      ) : (
        <ul aria-label="Signed-in sessions" className="flex flex-col">
          <Items>
            {sorted.map((session) => (
              <Item
                key={session.id}
                data-row-id={session.id}
                className="flex items-start gap-3 py-3.5 not-last:border-b not-last:border-line @lg:items-center"
              >
                <SessionRow
                  session={session}
                  now={now}
                  locale={locale}
                  pending={revoking.includes(session.id)}
                  onRevoke={
                    onRevoke === undefined || session.current === true
                      ? undefined
                      : () => {
                          removal.prepare([session.id]);
                          onRevoke(session.id);
                        }
                  }
                />
              </Item>
            ))}
          </Items>
        </ul>
      )}
      <p className="text-sm text-pretty text-fg-muted">
        Do not recognise a session? Sign it out
        {passwordHref === undefined ? (
          ' and change your password.'
        ) : (
          <>
            {' and '}
            <Anchor href={passwordHref} className={inlineLink}>
              change your password
            </Anchor>
            .
          </>
        )}
      </p>
      <RevokeOthersDialog
        open={confirming}
        count={others.length}
        finalFocus={removal.landing}
        onCancel={() => {
          setConfirming(false);
        }}
        onConfirm={() => {
          removal.prepare(others.map((session) => session.id));
          onRevokeOthers?.();
          setConfirming(false);
        }}
      />
    </BlockPanel>
  );
}

/** One session: the device, what it runs and this-device mark, then where and when it was seen. */
function SessionRow({
  session,
  now,
  locale,
  pending,
  onRevoke,
}: {
  session: Session;
  now: Date;
  locale: string;
  pending: boolean;
  onRevoke: (() => void) | undefined;
}) {
  const { Button } = useBlockParts();
  const DeviceIcon = DEVICE_ICON[session.device];
  const name = sessionName(session);
  const active = isActiveNow(session, now);
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-full border text-fg-muted',
          session.current === true
            ? 'border-accent bg-accent-subtle text-accent-strong'
            : 'border-line-strong bg-surface-sunken',
        )}
      >
        <DeviceIcon weight="duotone" className="size-5" />
      </span>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-2 @lg:flex-row @lg:items-center @lg:gap-3',
          // A session on its way out steps back while the sign out runs.
          pending && 'opacity-70',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-pretty">
              <span className="sr-only">{DEVICE_NAME[session.device]}, </span>
              {name}
            </span>
            {session.current === true && <Badge tone="info">This device</Badge>}
          </span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-fg-muted">
            {[
              session.location !== undefined && <span key="location">{session.location}</span>,
              session.ip !== undefined && (
                <span key="ip" className="font-mono text-xs">
                  <span className="sr-only">IP address </span>
                  {session.ip}
                </span>
              ),
              active ? (
                <span
                  key="seen"
                  className="inline-flex items-center gap-1.5 font-medium text-positive-strong"
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-positive" />
                  Active now
                </span>
              ) : (
                <span key="seen">
                  Last active{' '}
                  <time
                    dateTime={isoDateTime(session.lastActiveAt)}
                    title={formatDateTime(session.lastActiveAt, locale)}
                  >
                    {relativeTime(session.lastActiveAt, now, locale)}
                  </time>
                </span>
              ),
            ]
              .filter((part) => part !== false)
              // The dot travels with the part after it, so a wrapped line never ends on a dot. In a
              // narrow row the activity takes its own line, where a leading dot would dangle.
              .map((part, index, parts) => {
                const activity = index > 0 && index === parts.length - 1;
                return (
                  <span
                    key={index}
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      activity && 'basis-full @lg:basis-auto',
                    )}
                  >
                    {index > 0 && (
                      <MetaDot className={activity ? 'hidden @lg:inline' : undefined} />
                    )}
                    {part}
                  </span>
                );
              })}
          </span>
        </div>
        {onRevoke !== undefined && (
          <Button
            data-row-focus
            variant="ghost"
            size="sm"
            loading={pending}
            // Quiet until reached for: a list of red actions reads as alarm, not as a choice.
            className="-ms-2 self-start text-fg-muted hover:bg-negative-subtle hover:text-negative-strong focus-visible:text-negative-strong @lg:ms-0 @lg:self-center"
            aria-label={pending ? `Signing out, ${name}` : `Sign out, ${name}`}
            onClick={onRevoke}
          >
            <SignOutIcon aria-hidden weight="bold" className="size-4" />
            {pending ? 'Signing out' : 'Sign out'}
          </Button>
        )}
      </div>
    </>
  );
}

function MetaDot({ className }: { className?: string | undefined }) {
  return (
    <span aria-hidden className={cn('text-fg-subtle', className)}>
      ·
    </span>
  );
}

function RevokeOthersDialog({
  open,
  count,
  finalFocus,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  count: number;
  finalFocus: () => HTMLElement | true;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { Button } = useBlockParts();
  // The count stays put while the dialog closes, instead of dropping to zero mid-fade.
  const [shown, setShown] = useState(count);
  if (open && count !== shown) setShown(count);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>Sign out {countLabel(shown, 'other session')}?</DialogTitle>
          <DialogDescription>
            Every device but this one has to sign in again. Anything unsaved there is lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Sign out {shown === 1 ? 'session' : 'sessions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
