import { Badge, cn, type BadgeTone } from '@rectio/ui';
import type { ReactNode } from 'react';

import type { DocsBadgeData, DocsBadgeTone } from './docs';

const TONE: Record<DocsBadgeTone, BadgeTone> = {
  new: 'positive',
  beta: 'warning',
  deprecated: 'negative',
  pro: 'info',
  neutral: 'neutral',
};

/**
 * A small label in running text, a heading or the navigation: New, Beta, Deprecated, Pro. The word
 * carries the meaning; the tint only reinforces it.
 */
export function DocsBadge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: DocsBadgeTone | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Badge
      tone={TONE[tone]}
      data-slot="docs-badge"
      className={cn('align-middle font-sans', className)}
    >
      {children}
    </Badge>
  );
}

/** Reads the navigation's `badge` field, a string or `{ label, tone }`. */
export function badgeFrom(badge: string | DocsBadgeData | undefined): DocsBadgeData | null {
  if (badge === undefined) return null;
  return typeof badge === 'string' ? { label: badge, tone: toneOf(badge) } : badge;
}

/** New, Beta and Deprecated get their tone from the word, so content files can stay strings. */
function toneOf(label: string): DocsBadgeTone {
  const key = label.trim().toLowerCase();
  return key === 'new' || key === 'beta' || key === 'deprecated' || key === 'pro' ? key : 'neutral';
}
