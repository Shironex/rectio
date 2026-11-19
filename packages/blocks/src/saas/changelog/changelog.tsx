import { ArrowUpRightIcon, SparkleIcon, WrenchIcon, type Icon } from '@phosphor-icons/react';
import { Badge, cn, type BadgeTone } from '@rectio/ui';
import { useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { formatLongDate, resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import {
  CHANGE_KIND_LABELS,
  changelogCounts,
  filterChangelog,
  isReleaseUnseen,
  unseenReleaseCount,
  type ChangeKind,
  type ChangelogFilter,
  type ChangelogRelease,
} from './changelog.logic';

export interface ChangelogProps {
  releases: readonly ChangelogRelease[];
  /** The reader's last visit: releases after it are marked as new to them. */
  lastSeen?: Date | undefined;
  /** Offers "Mark as read" while something is unseen, so your app can move `lastSeen`. */
  onMarkSeen?: (() => void) | undefined;
  /** Offers "Show older releases" when there is more to fetch. */
  hasMore?: boolean | undefined;
  loadingMore?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  locale?: string;
  title?: string;
  className?: string;
}

const KINDS: Record<ChangeKind, { tone: BadgeTone; icon: Icon }> = {
  new: { tone: 'info', icon: SparkleIcon },
  improved: { tone: 'positive', icon: ArrowUpRightIcon },
  fixed: { tone: 'neutral', icon: WrenchIcon },
};

/**
 * Release notes, newest first: each release with its version and date, a title and summary, and
 * its changes tagged New, Improved or Fixed. Releases since the reader's last visit carry a marker
 * in words. The block holds only the filter.
 */
export function Changelog({
  releases,
  lastSeen,
  onMarkSeen,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  locale: requestedLocale,
  title = 'Changelog',
  className,
}: ChangelogProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const [filter, setFilter] = useState<ChangelogFilter>('all');
  const counts = changelogCounts(releases);
  const unseen = unseenReleaseCount(releases, lastSeen);
  const shown = filterChangelog(releases, filter);

  return (
    <BlockPanel
      title={title}
      description={
        <span aria-live="polite">
          {releases.length === 0
            ? 'No releases yet'
            : unseen > 0
              ? `${String(unseen)} ${unseen === 1 ? 'release' : 'releases'} since your last visit`
              : 'You are up to date'}
        </span>
      }
      actions={
        unseen > 0 && onMarkSeen !== undefined ? (
          <Button variant="secondary" size="sm" onClick={onMarkSeen}>
            Mark as read
          </Button>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-5"
    >
      {releases.length === 0 ? (
        <EmptyNote title="Nothing released yet">
          Release notes appear here with what is new, improved and fixed.
        </EmptyNote>
      ) : (
        <>
          <Segmented
            label="Show changes"
            value={filter}
            onValueChange={setFilter}
            options={(['all', 'new', 'improved', 'fixed'] as const).map((value) => ({
              value,
              label: value === 'all' ? 'All' : CHANGE_KIND_LABELS[value],
              hint: counts[value],
            }))}
          />
          {shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No {filter === 'all' ? '' : `${CHANGE_KIND_LABELS[filter].toLowerCase()} `}changes in
              these releases.
            </p>
          ) : (
            <ol className="flex flex-col">
              {shown.map((release) => (
                <Release
                  key={release.id}
                  release={release}
                  unseen={isReleaseUnseen(release, lastSeen)}
                  locale={locale}
                />
              ))}
            </ol>
          )}
          {hasMore && onLoadMore !== undefined && (
            <Button
              variant="secondary"
              loading={loadingMore}
              onClick={onLoadMore}
              className="self-center"
            >
              Show older releases
            </Button>
          )}
        </>
      )}
    </BlockPanel>
  );
}

function Release({
  release,
  unseen,
  locale,
}: {
  release: ChangelogRelease;
  unseen: boolean;
  locale: string;
}) {
  const heading = release.title ?? `Version ${release.version}`;
  return (
    <li className="grid gap-x-8 gap-y-3 border-t border-line py-5 first:border-t-0 first:pt-1 @2xl:grid-cols-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 @2xl:flex-col @2xl:gap-1.5">
        <span className="font-mono text-sm font-medium text-fg">{release.version}</span>
        <time dateTime={release.date.toISOString()} className="text-sm text-fg-muted numeric">
          {formatLongDate(release.date, locale)}
        </time>
        {unseen && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            New since your last visit
          </span>
        )}
      </div>
      <article className="flex min-w-0 flex-col gap-2 @2xl:col-span-3">
        <h3 className="font-display text-base font-heading tracking-tight text-balance">
          {heading}
        </h3>
        {release.summary !== undefined && (
          <p className="max-w-prose text-sm text-pretty text-fg-muted">{release.summary}</p>
        )}
        <ul className="mt-1 flex flex-col gap-2">
          {release.changes.map((change, index) => {
            const { tone, icon: KindIcon } = KINDS[change.kind];
            return (
              <li key={index} className="flex items-start gap-3 text-sm">
                <Badge tone={tone} className={cn('mt-px w-22 justify-center')}>
                  <KindIcon aria-hidden weight="bold" />
                  {CHANGE_KIND_LABELS[change.kind]}
                </Badge>
                <span className="min-w-0 flex-1 text-pretty">{change.text}</span>
              </li>
            );
          })}
        </ul>
      </article>
    </li>
  );
}
