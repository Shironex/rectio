import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';

import { DocsBadge } from '../lib/badge';
import { formatDate, isoDate } from '../lib/docs';
import { DocsLink, linkFocus } from '../lib/link';
import { useDocsParts } from '../lib/parts';
import {
  CHANGE_LABELS,
  groupChanges,
  isBreaking,
  releaseId,
  sortReleases,
  type ChangeType,
  type Release,
} from './changelog.logic';

export interface ChangelogProps {
  releases: readonly Release[];
  /** Marks the newest release as the latest. Default true. */
  markLatest?: boolean;
  locale?: string | undefined;
  /** Heading level of each version: 2 when the changelog is the page. */
  level?: 2 | 3;
  className?: string;
}

const GROUP_TONE: Record<ChangeType, string> = {
  breaking: 'text-negative-strong',
  security: 'text-warning-strong',
  feature: 'text-positive-strong',
  improvement: 'text-info-strong',
  fix: 'text-fg',
  deprecation: 'text-fg-muted',
};

/**
 * Release notes, newest first: each version with its date and headline in a column that stays in
 * view beside its changes on wide screens, the changes grouped as breaking, security, added,
 * improved, fixed and deprecated. Every version is a heading with an anchor, so a release can be
 * linked and listed in the table of contents.
 */
export function Changelog({
  releases,
  markLatest = true,
  locale,
  level = 2,
  className,
}: ChangelogProps) {
  const { Reveal } = useDocsParts();
  const Heading = level === 2 ? 'h2' : 'h3';
  const sorted = sortReleases(releases);
  return (
    <ol data-slot="changelog" className={cn('@container flex flex-col', className)}>
      {sorted.map((release, index) => {
        const id = releaseId(release.version);
        return (
          <li
            key={release.version}
            className="grid gap-x-10 gap-y-4 border-t border-line py-10 first:border-t-0 first:pt-2 @3xl:grid-cols-4"
          >
            <div className="flex flex-col gap-2 @3xl:sticky @3xl:top-24 @3xl:self-start">
              <Heading id={id} className="scroll-mt-24">
                <a
                  href={`#${id}`}
                  className={cn('font-mono text-lg font-strong text-fg', linkFocus)}
                >
                  {release.version}
                </a>
              </Heading>
              <time dateTime={isoDate(release.date)} className="text-sm text-fg-muted">
                {formatDate(release.date, locale)}
              </time>
              <div className="flex flex-wrap gap-1.5">
                {markLatest && index === 0 && <DocsBadge tone="new">Latest</DocsBadge>}
                {isBreaking(release) && <DocsBadge tone="deprecated">Breaking</DocsBadge>}
              </div>
            </div>
            <Reveal className="flex min-w-0 flex-col gap-5 @3xl:col-span-3">
              {release.title !== undefined && (
                <p className="font-display text-2xl font-heading tracking-tight text-balance text-fg">
                  {release.title}
                </p>
              )}
              {release.summary !== undefined && (
                <p className="max-w-prose text-base text-pretty text-fg-muted">{release.summary}</p>
              )}
              {groupChanges(release.changes).map((group) => (
                <div key={group.type} className="flex flex-col gap-2">
                  <h4
                    className={cn(
                      'text-xs font-strong tracking-caps uppercase',
                      GROUP_TONE[group.type],
                    )}
                  >
                    {CHANGE_LABELS[group.type]}
                  </h4>
                  <ul className="flex flex-col gap-1.5 ps-5">
                    {group.changes.map((change) => (
                      <li
                        key={change.text}
                        className="list-disc text-base text-pretty text-fg-muted marker:text-fg-subtle"
                      >
                        {change.text}
                        {change.ref !== undefined && (
                          <>
                            {' '}
                            <DocsLink
                              href={change.ref.href}
                              className={cn(
                                'font-mono text-sm text-accent-strong underline-offset-4 hover:underline',
                                linkFocus,
                              )}
                            >
                              {change.ref.label}
                            </DocsLink>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {release.href !== undefined && (
                <DocsLink
                  href={release.href}
                  className={cn(
                    'inline-flex w-fit items-center gap-1 text-sm font-medium text-accent-strong underline-offset-4 hover:underline',
                    linkFocus,
                  )}
                >
                  Full release notes for {release.version}
                  <ArrowUpRightIcon aria-hidden weight="bold" className="size-3.5" />
                </DocsLink>
              )}
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
