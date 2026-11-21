'use client';

import { DocsBadge, formatDate, isoDate } from '@rectio/blocks/docs';
import Link from 'next/link';

import { inlineParts, type ChangelogEntry, type SiteRelease } from '@/lib/changelog-data';

const focus =
  'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';
const inlineLink = `text-accent-strong underline decoration-accent-strong/40 underline-offset-4 pointer-fine:hover:decoration-accent-strong ${focus}`;

/** An entry's text with its `code` and links drawn; site links go through Next for the base path. */
function Inline({ text }: { text: string }) {
  return inlineParts(text).map((part, i) => {
    if (part.kind === 'code') {
      return (
        <code
          key={i}
          className="rounded-control bg-surface-hover px-1 py-px font-mono text-sm text-fg"
        >
          {part.value}
        </code>
      );
    }
    if (part.kind === 'link') {
      return part.href.startsWith('/') ? (
        <Link key={i} href={part.href} className={inlineLink}>
          {part.value}
        </Link>
      ) : (
        <a key={i} href={part.href} className={inlineLink}>
          {part.value}
        </a>
      );
    }
    return part.value;
  });
}

function Entry({ entry }: { entry: ChangelogEntry }) {
  return (
    <li className="list-disc text-base text-pretty text-fg-muted marker:text-fg-subtle">
      <Inline text={entry.text} />
      {entry.points.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 ps-5">
          {entry.points.map((point) => (
            <li
              key={point}
              className="list-disc text-base text-pretty text-fg-muted marker:text-fg-subtle"
            >
              <Inline text={point} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * The site's releases, laid out as the kit's changelog block lays out a version: the date and its
 * labels in a column that stays in view on wide screens, the changes beside it. The block groups by
 * kind of change; rectio groups by what changed (kit, templates, themes, CLI, docs), so this draws
 * the same parts with those groups.
 */
export function ReleaseList({
  releases,
  latestId,
}: {
  releases: readonly SiteRelease[];
  latestId?: string | undefined;
}) {
  return (
    <ol data-slot="changelog" className="@container flex flex-col">
      {releases.map((release) => (
        <li
          key={release.id}
          className="grid gap-x-10 gap-y-4 border-t border-line py-12 first:border-t-0 first:pt-2 md:py-16 @3xl:grid-cols-4"
        >
          <div className="flex flex-col gap-2 @3xl:sticky @3xl:top-24 @3xl:self-start">
            <h2 id={release.id} className="group scroll-mt-24">
              <a
                href={`#${release.id}`}
                className={`inline-flex items-center gap-2 text-base font-medium text-fg-muted tabular-nums pointer-coarse:min-h-11 pointer-fine:hover:text-fg ${focus}`}
              >
                {release.date === undefined ? (
                  'Unreleased'
                ) : (
                  <time dateTime={isoDate(release.date)}>{formatDate(release.date, 'en-GB')}</time>
                )}
                {/* The title reads with the date in the outline; sighted readers see it beside. */}
                <span className="sr-only">{`: ${release.title}`}</span>
                <span
                  aria-hidden
                  data-anchor-mark
                  className="font-mono text-accent-strong opacity-0 transition-opacity duration-fast ease-standard group-focus-within:opacity-100 pointer-coarse:opacity-100 pointer-fine:group-hover:opacity-100"
                >
                  #
                </span>
              </a>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {release.id === latestId && <DocsBadge tone="new">Latest</DocsBadge>}
              {release.date === undefined && <DocsBadge>On main</DocsBadge>}
              {release.version !== undefined && (
                <DocsBadge className="font-mono">{`rectio ${release.version}`}</DocsBadge>
              )}
              {release.cli !== undefined && (
                <DocsBadge className="font-mono">{`CLI ${release.cli}`}</DocsBadge>
              )}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-7 @3xl:col-span-3">
            <div className="flex flex-col gap-3">
              <p className="font-display text-2xl font-heading tracking-tight text-balance text-fg md:text-3xl">
                {release.title}
              </p>
              {release.summary !== undefined && (
                <p className="max-w-prose text-base text-pretty text-fg-muted">{release.summary}</p>
              )}
            </div>
            {release.groups.map((group) => (
              <section
                key={group.area}
                aria-labelledby={`${release.id}-${group.area}`}
                className="flex flex-col gap-2"
              >
                <h3
                  id={`${release.id}-${group.area}`}
                  className="text-xs font-strong tracking-caps text-fg-muted uppercase"
                >
                  {group.label}
                </h3>
                <ul className="flex max-w-prose flex-col gap-1.5 ps-5">
                  {group.entries.map((entry) => (
                    <Entry key={entry.text} entry={entry} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
