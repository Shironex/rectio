/** Kinds of change, in the order a release lists them: what breaks first. */
export const CHANGE_TYPES = [
  'breaking',
  'security',
  'feature',
  'improvement',
  'fix',
  'deprecation',
] as const;

export type ChangeType = (typeof CHANGE_TYPES)[number];

export interface Change {
  type: ChangeType;
  /** One line, in the past tense or as a statement: "Retries now back off exponentially." */
  text: string;
  /** A pull request, issue or commit reference, such as "#412". */
  ref?: { label: string; href: string } | undefined;
}

export interface Release {
  /** A semantic version, such as "2.4.0". */
  version: string;
  /** ISO date of the release. */
  date: string;
  /** A headline for the release, such as "Scheduled jobs". */
  title?: string | undefined;
  /** A paragraph on what the release is about. */
  summary?: string | undefined;
  changes: readonly Change[];
  /** Link to the full release notes or the diff. */
  href?: string | undefined;
}

export const CHANGE_LABELS: Record<ChangeType, string> = {
  breaking: 'Breaking',
  security: 'Security',
  feature: 'Added',
  improvement: 'Improved',
  fix: 'Fixed',
  deprecation: 'Deprecated',
};

/** `2.10.0` against `2.9.1`, numerically; a pre-release sorts before its release. */
export function compareVersions(a: string, b: string): number {
  const parse = (version: string) => {
    const [core = '', pre] = version.replace(/^v/, '').split('-', 2);
    return { parts: core.split('.').map((n) => Number.parseInt(n, 10) || 0), pre };
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < Math.max(left.parts.length, right.parts.length); i += 1) {
    const diff = (left.parts[i] ?? 0) - (right.parts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  if (left.pre === right.pre) return 0;
  if (left.pre === undefined) return 1;
  if (right.pre === undefined) return -1;
  return left.pre.localeCompare(right.pre, undefined, { numeric: true });
}

/** Newest first. */
export function sortReleases(releases: readonly Release[]): Release[] {
  return [...releases].sort((a, b) => compareVersions(b.version, a.version));
}

/** A release's changes grouped by kind, in `CHANGE_TYPES` order, empty kinds left out. */
export function groupChanges(
  changes: readonly Change[],
): { type: ChangeType; changes: Change[] }[] {
  return CHANGE_TYPES.map((type) => ({
    type,
    changes: changes.filter((change) => change.type === type),
  })).filter((group) => group.changes.length > 0);
}

/** The anchor id of a release: `2.4.0` becomes `v2-4-0`. */
export function releaseId(version: string): string {
  return `v${version.replace(/^v/, '').replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

/** Whether a release carries breaking changes, for the upgrade warning. */
export function isBreaking(release: Release): boolean {
  return release.changes.some((change) => change.type === 'breaking');
}
