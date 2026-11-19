import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { useMarketingParts } from '../lib/parts';
import { Section, useHeadingId, type SectionTone } from '../lib/section';
import { formatStat, type Stat } from './stat-row.logic';

export interface StatRowProps {
  stats: readonly Stat[];
  /** A sentence that sets the figures up, shown beside them on wide screens. */
  lead?: ReactNode;
  locale?: string;
  /** Names the section when there is no lead, such as "Northlake in numbers". */
  label?: string;
  tone?: SectionTone;
  className?: string;
}

/**
 * Three or four big figures with what each one counts, divided by hairlines. With a `lead`, a
 * sentence sets them up on the left. In the motion variant each figure counts up once, on first
 * view, and lands exactly on its value.
 */
export function StatRow({
  stats,
  lead,
  locale,
  label = 'Key figures',
  tone,
  className,
}: StatRowProps) {
  const { Reveal, Count } = useMarketingParts();
  const headingId = useHeadingId();
  return (
    <Section
      tone={tone}
      width="wide"
      {...(lead === undefined ? { label } : { labelledBy: headingId })}
      className={className}
    >
      <div className={cn('grid gap-10', lead !== undefined && 'lg:grid-cols-12 lg:items-end')}>
        {lead !== undefined && (
          <Reveal className="lg:col-span-4">
            <h2
              id={headingId}
              className="font-display text-2xl font-regular tracking-tight text-balance text-fg sm:text-3xl"
            >
              {lead}
            </h2>
          </Reveal>
        )}
        <Reveal
          as="dl"
          stagger
          className={cn(
            'grid grid-cols-2 gap-y-10 @4xl:grid-flow-col @4xl:auto-cols-fr @4xl:grid-cols-none',
            lead !== undefined && 'lg:col-span-8',
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="flex flex-col-reverse gap-2 border-s border-line ps-5 @4xl:ps-6"
            >
              <dt className="text-base text-pretty text-fg-muted">{stat.label}</dt>
              <dd className="font-display text-4xl font-regular tracking-tight text-fg tabular-nums lining-nums sm:text-5xl">
                <Count value={stat.value} format={(value) => formatStat(stat, value, locale)} />
              </dd>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
