export type ChangeKind = 'new' | 'improved' | 'fixed';

export interface ChangelogChange {
  kind: ChangeKind;
  text: string;
}

export interface ChangelogRelease {
  id: string;
  /** As you print it: "2.14", "v2.14.0", "March release". */
  version: string;
  date: Date;
  title?: string;
  /** One or two sentences above the list of changes. */
  summary?: string;
  changes: readonly ChangelogChange[];
}

export type ChangelogFilter = 'all' | ChangeKind;

export const CHANGE_KIND_LABELS: Record<ChangeKind, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
};

/** Releases newest first, each keeping only the changes of the chosen kind; empty ones drop out. */
export function filterChangelog(
  releases: readonly ChangelogRelease[],
  filter: ChangelogFilter,
): ChangelogRelease[] {
  return [...releases]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((release) =>
      filter === 'all'
        ? release
        : { ...release, changes: release.changes.filter((change) => change.kind === filter) },
    )
    .filter((release) => filter === 'all' || release.changes.length > 0);
}

/** How many changes of each kind, across every release. */
/** How many releases carry each kind of change: the same unit as "2 releases since your last visit". */
export function changelogReleaseCounts(
  releases: readonly ChangelogRelease[],
): Record<ChangelogFilter, number> {
  const counts: Record<ChangelogFilter, number> = {
    all: releases.length,
    new: 0,
    improved: 0,
    fixed: 0,
  };
  for (const release of releases) {
    for (const kind of ['new', 'improved', 'fixed'] as const) {
      if (release.changes.some((change) => change.kind === kind)) counts[kind] += 1;
    }
  }
  return counts;
}

export function changelogCounts(
  releases: readonly ChangelogRelease[],
): Record<ChangelogFilter, number> {
  const counts: Record<ChangelogFilter, number> = { all: 0, new: 0, improved: 0, fixed: 0 };
  for (const release of releases) {
    for (const change of release.changes) {
      counts.all += 1;
      counts[change.kind] += 1;
    }
  }
  return counts;
}

/** Released after the reader last looked. Without a last visit, nothing is marked. */
export function isReleaseUnseen(release: ChangelogRelease, lastSeen: Date | undefined): boolean {
  return lastSeen !== undefined && release.date.getTime() > lastSeen.getTime();
}

export function unseenReleaseCount(
  releases: readonly ChangelogRelease[],
  lastSeen: Date | undefined,
): number {
  return releases.filter((release) => isReleaseUnseen(release, lastSeen)).length;
}
