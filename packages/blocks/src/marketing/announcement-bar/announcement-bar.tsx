import { ArrowRightIcon, XIcon } from '@phosphor-icons/react/ssr';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { Anchor, linkFocus, type MarketingAction } from '../lib/action';
import { Container } from '../lib/section';

export interface AnnouncementBarProps {
  /** One short line, such as "Close checklists are here: every task of month end in one view". */
  message: ReactNode;
  /** A short tag before the message, such as "New" or a version. */
  tag?: string;
  /** Where to read more, such as the changelog entry. */
  action?: MarketingAction;
  /** Shows a close button. Remember the dismissal yourself, by announcement id. */
  onDismiss?: () => void;
  /** `accent` fills the bar with the accent; `subtle` tints it softly. */
  tone?: 'accent' | 'subtle';
  className?: string;
}

/**
 * A thin bar above the header for one piece of news: a release, an event, a changelog entry. The
 * whole line is the link on narrow screens; the close button sits apart from it.
 */
export function AnnouncementBar({
  message,
  tag,
  action,
  onDismiss,
  tone = 'subtle',
  className,
}: AnnouncementBarProps) {
  const accent = tone === 'accent';
  const content = (
    <>
      {tag !== undefined && (
        <span
          className={cn(
            'shrink-0 rounded-badge px-1.5 py-0.5 text-xs font-strong tracking-caps uppercase',
            accent ? 'bg-accent-contrast text-accent' : 'bg-accent text-accent-contrast',
          )}
        >
          {tag}
        </span>
      )}
      <span className="min-w-0 truncate">{message}</span>
      {action !== undefined && (
        <span className="inline-flex shrink-0 items-center gap-1 font-medium underline-offset-4 group-hover/bar:underline">
          <span className="max-sm:sr-only">{action.label}</span>
          <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
        </span>
      )}
    </>
  );
  return (
    <aside
      aria-label="Announcement"
      data-slot="announcement-bar"
      className={cn(
        'text-sm',
        accent ? 'bg-accent text-accent-contrast' : 'border-b border-line bg-accent-subtle text-fg',
        className,
      )}
    >
      <Container width="wide" className="flex min-h-10 items-center gap-2 py-1.5">
        <div className="flex min-w-0 flex-1 justify-center">
          {action === undefined ? (
            <p className="flex min-w-0 items-center gap-2.5">{content}</p>
          ) : (
            <Anchor
              href={action.href}
              external={action.external}
              onClick={action.onClick}
              className={cn(
                'group/bar flex min-h-8 min-w-0 items-center gap-2.5 pointer-coarse:min-h-(--rx-button-height-touch)',
                linkFocus,
              )}
            >
              {content}
            </Anchor>
          )}
        </div>
        {onDismiss !== undefined && (
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={onDismiss}
            className={cn(
              'relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control',
              accent ? 'pointer-fine:hover:bg-accent-hover' : 'pointer-fine:hover:bg-surface-hover',
              'pointer-coarse:after:absolute pointer-coarse:after:size-(--rx-button-height-touch)',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            )}
          >
            <XIcon aria-hidden weight="bold" className="size-3.5" />
          </button>
        )}
      </Container>
    </aside>
  );
}
