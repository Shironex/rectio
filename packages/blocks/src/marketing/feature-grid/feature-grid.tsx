import { CheckIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { ActionLink, type MarketingAction } from '../lib/action';
import { useMarketingParts } from '../lib/parts';
import { Eyebrow, Section, SectionHeader, useHeadingId, type SectionTone } from '../lib/section';

interface FeatureSectionCopy {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  tone?: SectionTone;
  className?: string;
}

export interface IconFeature {
  id: string;
  /** An icon from your icon set, drawn at the current text colour. */
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export interface FeatureIconGridProps extends FeatureSectionCopy {
  features: readonly IconFeature[];
  columns?: 2 | 3 | 4;
}

export interface FeatureRow {
  id: string;
  title: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  /** Two to four short points, each checked off. */
  points?: readonly string[];
  action?: MarketingAction;
  /** The feature itself, rendered live: a block or component in its real state. */
  visual: ReactNode;
}

export interface FeatureRowsProps extends Omit<FeatureSectionCopy, 'title'> {
  title?: ReactNode;
  rows: readonly FeatureRow[];
}

export type BentoSize = 'regular' | 'wide' | 'tall' | 'full';
export type BentoTone = 'plain' | 'tinted' | 'sunken';

export interface BentoItem {
  id: string;
  title: string;
  description?: ReactNode;
  /** Live UI for the tile. It sits under the text and bleeds to the tile's edge. */
  visual?: ReactNode;
  /** Regular is a third of the row, wide two thirds, full the whole row; tall spans two rows. */
  size?: BentoSize;
  tone?: BentoTone;
}

export interface FeatureBentoProps extends FeatureSectionCopy {
  items: readonly BentoItem[];
}

const COLUMNS = {
  2: '@2xl:grid-cols-2',
  3: '@2xl:grid-cols-2 @5xl:grid-cols-3',
  4: '@2xl:grid-cols-2 @5xl:grid-cols-4',
};

/**
 * Features as a ruled grid: an icon, a title and a sentence each, separated by hairlines instead of
 * boxed in cards, so a long list stays calm.
 */
export function FeatureIconGrid({
  title,
  description,
  eyebrow,
  features,
  columns = 3,
  tone,
  className,
}: FeatureIconGridProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  return (
    <Section tone={tone} labelledBy={headingId} className={className}>
      <SectionHeader id={headingId} title={title} description={description} eyebrow={eyebrow} />
      <Reveal
        as="ul"
        stagger
        className={cn(
          'mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line',
          COLUMNS[columns],
        )}
      >
        {features.map((feature) => (
          <li key={feature.id} className="flex flex-col gap-3 bg-surface p-6 sm:p-8">
            <span
              aria-hidden
              className="inline-flex size-10 items-center justify-center rounded-control bg-accent-subtle text-accent-strong [&_svg]:size-5"
            >
              {feature.icon}
            </span>
            <h3 className="mt-2 text-lg font-strong text-fg">{feature.title}</h3>
            <p className="text-base text-pretty text-fg-muted">{feature.description}</p>
          </li>
        ))}
      </Reveal>
    </Section>
  );
}

/**
 * Features one at a time: copy on one side, the live feature on a soft tinted panel on the other,
 * switching sides row by row. Keep it to two or three rows, then change the layout.
 */
export function FeatureRows({
  title,
  description,
  eyebrow,
  rows,
  tone,
  className,
}: FeatureRowsProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  return (
    <Section
      tone={tone}
      width="wide"
      {...(title === undefined ? { label: 'Features' } : { labelledBy: headingId })}
      className={className}
    >
      {title !== undefined && (
        <SectionHeader
          id={headingId}
          title={title}
          description={description}
          eyebrow={eyebrow}
          className="mb-16"
        />
      )}
      <div className="flex flex-col gap-20 sm:gap-28">
        {rows.map((row, index) => {
          const RowHeading = title === undefined ? 'h2' : 'h3';
          return (
            <article
              key={row.id}
              className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16"
              aria-labelledby={`${headingId}-${row.id}`}
            >
              <Reveal
                stagger
                className={cn(
                  'flex flex-col gap-5 lg:col-span-5',
                  index % 2 === 1 && 'lg:order-last',
                )}
              >
                {row.eyebrow !== undefined && <Eyebrow>{row.eyebrow}</Eyebrow>}
                <RowHeading
                  id={`${headingId}-${row.id}`}
                  className="font-display text-3xl font-regular tracking-tight text-balance text-fg"
                >
                  {row.title}
                </RowHeading>
                <p className="text-lg text-pretty text-fg-muted">{row.description}</p>
                {row.points !== undefined && row.points.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {row.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-base text-fg">
                        <span
                          aria-hidden
                          className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-positive-subtle text-positive-strong"
                        >
                          <CheckIcon weight="bold" className="size-3" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
                {row.action !== undefined && (
                  <div>
                    <ActionLink action={row.action} variant="text" arrow />
                  </div>
                )}
              </Reveal>
              <Reveal className="lg:col-span-7">
                <div className="rounded-panel border border-line bg-linear-to-br from-accent-subtle to-surface-sunken p-2 sm:p-8">
                  {row.visual}
                </div>
              </Reveal>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

const SIZE: Record<BentoSize, string> = {
  regular: '@3xl:col-span-2',
  wide: '@3xl:col-span-4',
  tall: '@3xl:col-span-2 @3xl:row-span-2',
  full: '@3xl:col-span-6',
};

const TONE: Record<BentoTone, string> = {
  plain: 'bg-surface',
  tinted: 'bg-linear-to-b from-accent-subtle to-surface',
  sunken: 'bg-surface-sunken',
};

/**
 * A grid of tiles in mixed sizes, each a feature with its live UI underneath: the product shown
 * working rather than described. Plan the sizes so each row fills: a wide and a regular, three
 * regulars, or a tall beside two regulars stacked.
 */
export function FeatureBento({
  title,
  description,
  eyebrow,
  items,
  tone,
  className,
}: FeatureBentoProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  return (
    <Section tone={tone} width="wide" labelledBy={headingId} className={className}>
      <SectionHeader id={headingId} title={title} description={description} eyebrow={eyebrow} />
      <Reveal
        as="ul"
        stagger
        className="mt-12 grid grid-flow-dense grid-cols-1 gap-4 @3xl:grid-cols-6"
      >
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              'flex min-w-0 flex-col overflow-hidden rounded-panel border border-line',
              SIZE[item.size ?? 'regular'],
              TONE[item.tone ?? 'plain'],
            )}
          >
            <div className="flex flex-col gap-2 p-6 sm:p-7">
              <h3 className="text-lg font-strong text-fg">{item.title}</h3>
              {item.description !== undefined && (
                <p className="max-w-md text-base text-pretty text-fg-muted">{item.description}</p>
              )}
            </div>
            {item.visual !== undefined && (
              <div
                className={cn(
                  'min-w-0 px-6 pb-6 sm:px-7 sm:pb-7',
                  // A tall tile centres its visual in the spare height instead of leaving a hole under the copy.
                  item.size === 'tall' ? 'my-auto' : 'mt-auto',
                )}
              >
                {item.visual}
              </div>
            )}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
