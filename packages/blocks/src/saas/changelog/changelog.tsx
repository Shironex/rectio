import {
  ArrowUpRightIcon,
  MegaphoneIcon,
  SparkleIcon,
  WrenchIcon,
  type Icon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { Fragment, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
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

const KIND_ORDER: readonly ChangeKind[] = ['new', 'improved', 'fixed'];

const KIND_ICONS: Record<ChangeKind, Icon> = {
  new: SparkleIcon,
  improved: ArrowUpRightIcon,
  fixed: WrenchIcon,
};

/**
 * Release notes, newest first: each release headed by its version and date, an optional title and
 * summary, and its changes grouped under New, Improved and Fixed. One marker sets apart the releases
 * since the reader's last visit. The block holds only the filter.
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
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-control bg-surface-sunken px-6 py-10 text-center"
        >
          <span
            aria-hidden
            className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-fg-muted ring-1 ring-line"
          >
            <MegaphoneIcon weight="bold" className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Nothing released yet</p>
            <p className="max-w-sm text-sm text-pretty text-fg-muted">
              The first release note lands here with its version and date. Check back after the next
              update.
            </p>
          </div>
        </div>
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
              {shown.map((release, index) => {
                const unseen = isReleaseUnseen(release, lastSeen);
                const previous = shown[index - 1];
                const previousUnseen =
                  previous !== undefined && isReleaseUnseen(previous, lastSeen);
                return (
                  <Fragment key={release.id}>
                    {/* One marker for the run of unseen releases, one where the seen ones begin. */}
                    {unseen && index === 0 && (
                      <ReleaseDivider label="New since your last visit" accent />
                    )}
                    {!unseen && previousUnseen && <ReleaseDivider label="Earlier" />}
                    <Release
                      release={release}
                      unseen={unseen}
                      divided={index > 0 && unseen === previousUnseen}
                      locale={locale}
                    />
                  </Fragment>
                );
              })}
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

function ReleaseDivider({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <li
      role="separator"
      aria-label={label}
      className={cn(
        'flex items-center gap-3 pb-1 text-xs font-medium',
        accent ? 'text-accent-strong' : 'text-fg-subtle',
        !accent && 'pt-5',
      )}
    >
      {accent && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
      <span aria-hidden>{label}</span>
      <span aria-hidden className={cn('h-px flex-1', accent ? 'bg-accent' : 'bg-line')} />
    </li>
  );
}

function Release({
  release,
  unseen,
  divided,
  locale,
}: {
  release: ChangelogRelease;
  unseen: boolean;
  /** Draws a rule above, between two releases of the same run. */
  divided: boolean;
  locale: string;
}) {
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    changes: release.changes.filter((change) => change.kind === kind),
  })).filter((group) => group.changes.length > 0);
  return (
    <li
      className={cn(
        'grid gap-x-8 gap-y-3 py-5 @2xl:grid-cols-4',
        divided && 'border-t border-line',
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 @2xl:flex-col @2xl:gap-1">
        <h3 className="font-display text-lg font-heading tracking-tight numeric">
          {release.version}
          {unseen && <span className="sr-only">, new to you</span>}
        </h3>
        <time dateTime={release.date.toISOString()} className="text-sm text-fg-muted numeric">
          {formatLongDate(release.date, locale)}
        </time>
      </div>
      <article className="flex min-w-0 flex-col gap-4 @2xl:col-span-3">
        {(release.title !== undefined || release.summary !== undefined) && (
          <div className="flex flex-col gap-1">
            {release.title !== undefined && (
              <p className="font-medium text-balance">{release.title}</p>
            )}
            {release.summary !== undefined && (
              <p className="max-w-prose text-sm text-pretty text-fg-muted">{release.summary}</p>
            )}
          </div>
        )}
        {groups.map(({ kind, changes }) => (
          <section key={kind} className="flex flex-col gap-2">
            <KindTag kind={kind} />
            <ul className="flex list-disc flex-col gap-1.5 ps-5 text-sm marker:text-fg-subtle">
              {changes.map((change, index) => (
                <li key={index} className="text-pretty">
                  {change.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </li>
  );
}

/** A kind's subhead: neutral with its icon, and only New in the accent. */
function KindTag({ kind }: { kind: ChangeKind }) {
  const KindIcon = KIND_ICONS[kind];
  return (
    <h4
      className={cn(
        'inline-flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 text-xs font-medium',
        kind === 'new'
          ? 'bg-accent-subtle text-accent-strong'
          : 'bg-surface-sunken text-fg-muted ring-1 ring-line ring-inset',
      )}
    >
      <KindIcon aria-hidden weight="bold" className="size-3.5" />
      {CHANGE_KIND_LABELS[kind]}
    </h4>
  );
}
