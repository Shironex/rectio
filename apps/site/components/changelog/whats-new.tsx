import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

import { latestRelease, readChangelog } from '@/lib/changelog';

/**
 * A one line link to the newest release, at the top of the docs sidebar:
 * the docs have no site bar, so this is where they point to the changelog.
 */
export function WhatsNew() {
  const latest = latestRelease(readChangelog());
  if (latest === undefined) return null;
  return (
    <Link
      href={`/changelog#${latest.id}`}
      className="group flex min-h-11 items-center gap-2 rounded-control px-2 text-sm text-fg-muted outline-offset-2 pointer-fine:min-h-8 pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
    >
      <span className="shrink-0 font-strong text-fg">What&apos;s new</span>
      <span className="min-w-0 truncate">{latest.title}</span>
      <ArrowRightIcon aria-hidden weight="bold" className="ms-auto size-3.5 shrink-0" />
    </Link>
  );
}
