import {
  ArrowUpRightIcon,
  BellRingingIcon,
  MegaphoneIcon,
  SparkleIcon,
  WrenchIcon,
  type Icon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
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
  /** Offers "Subscribe to updates" on the empty changelog. */
  onSubscribe?: (() => void) | undefined;
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
  onSubscribe,
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
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <MegaphoneIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              Nothing released yet
            </span>
          }
        >
          The first release note lands here with its version, date and changes.
          {onSubscribe !== undefined && (
            <span className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={onSubscribe}>
                <BellRingingIcon aria-hidden weight="bold" className="size-4" />
                Subscribe to updates
              </Button>
            </span>
          )}
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
            <ReleaseList releases={shown} lastSeen={lastSeen} locale={locale} />
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

/**
 * With a last visit to compare against, the releases split under two real headings, new since
 * then and earlier, each drawn as a labelled rule; otherwise they are one plain list.
 */
function ReleaseList({
  releases,
  lastSeen,
  locale,
}: {
  releases: readonly ChangelogRelease[];
  lastSeen: Date | undefined;
  locale: string;
}) {
  const unseen = releases.filter((release) => isReleaseUnseen(release, lastSeen));
  const seen = releases.filter((release) => !isReleaseUnseen(release, lastSeen));
  if (unseen.length === 0) {
    return <Releases releases={releases} heading="h3" locale={locale} />;
  }
  return (
    <div className="flex flex-col gap-2">
      <section className="flex flex-col">
        <GroupHeading label="New since your last visit" accent />
        <Releases releases={unseen} heading="h4" locale={locale} />
      </section>
      {seen.length > 0 && (
        <section className="flex flex-col">
          <GroupHeading label="Earlier" />
          <Releases releases={seen} heading="h4" locale={locale} />
        </section>
      )}
    </div>
  );
}

function GroupHeading({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <h3
      className={cn(
        'flex items-center gap-3 text-sm font-medium',
        accent ? 'text-accent-strong' : 'text-fg-muted',
      )}
    >
      {accent && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
      {label}
      <span aria-hidden className={cn('h-px flex-1', accent ? 'bg-accent' : 'bg-line')} />
    </h3>
  );
}

function Releases({
  releases,
  heading,
  locale,
}: {
  releases: readonly ChangelogRelease[];
  heading: 'h3' | 'h4';
  locale: string;
}) {
  return (
    <ol className="flex flex-col">
      {releases.map((release, index) => (
        <Release
          key={release.id}
          release={release}
          heading={heading}
          divided={index > 0}
          locale={locale}
        />
      ))}
    </ol>
  );
}

function Release({
  release,
  heading: Heading,
  divided,
  locale,
}: {
  release: ChangelogRelease;
  heading: 'h3' | 'h4';
  /** Draws a rule above, between two releases of the same group. */
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
        'grid gap-x-8 gap-y-3 py-5 @2xl:grid-cols-5',
        divided && 'border-t border-line',
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 @2xl:flex-col @2xl:gap-1">
        <Heading className="font-display text-2xl font-heading tracking-tight numeric">
          {release.version}
        </Heading>
        <time dateTime={release.date.toISOString()} className="text-sm text-fg-muted numeric">
          {formatLongDate(release.date, locale)}
        </time>
      </div>
      <article className="flex min-w-0 flex-col gap-4 @2xl:col-span-4">
        {(release.title !== undefined || release.summary !== undefined) && (
          <div className="flex flex-col gap-1">
            {release.title !== undefined && (
              <p className="font-medium text-balance">{release.title}</p>
            )}
            {release.summary !== undefined && (
              <p className="text-sm text-pretty text-fg-muted">{release.summary}</p>
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

/** A kind's subhead: a small capitals label with its icon, and only New on a filled tint. */
function KindTag({ kind }: { kind: ChangeKind }) {
  const KindIcon = KIND_ICONS[kind];
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 self-start text-xs font-semibold tracking-wide uppercase',
        kind === 'new'
          ? 'rounded-full bg-accent-subtle px-2 py-0.5 text-accent-strong'
          : 'text-fg-muted',
      )}
    >
      <KindIcon aria-hidden weight="bold" className="size-3.5" />
      {CHANGE_KIND_LABELS[kind]}
    </p>
  );
}
