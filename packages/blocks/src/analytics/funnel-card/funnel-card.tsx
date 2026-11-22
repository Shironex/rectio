'use client';

import { ChartCard, TrendChip } from '@rectio/ui';
import {
  FunnelChart,
  formatValue,
  type FunnelChartProps,
  type FunnelStage,
} from '@rectio/ui/charts';
import type { ReactNode } from 'react';

import { resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { funnelInsight } from './funnel-card.logic';

export interface FunnelCardMessages {
  title: string;
  /** Under the figure: what it is. */
  conversion: string;
  /** Beside the change when no comparison is given. */
  vsBefore: string;
  /** The line naming the step that loses the most. */
  biggestDrop: (info: { from: string; to: string; lost: string }) => string;
}

export const FUNNEL_CARD_MESSAGES: FunnelCardMessages = {
  title: 'Conversion funnel',
  conversion: 'converted end to end',
  vsBefore: 'vs the period before',
  biggestDrop: ({ from, to, lost }) => `Biggest drop: ${from} to ${to}, ${lost} lost`,
};

export interface FunnelCardProps {
  stages: readonly FunnelStage[];
  /** The same stages in the period before, for the change in conversion. */
  previous?: readonly FunnelStage[] | undefined;
  title?: string | undefined;
  description?: ReactNode;
  /** What the change is against: `vs October`. */
  comparison?: ReactNode;
  /**
   * `horizontal`, stages as rows with the step between each, best for long stage names and phones;
   * `vertical`, stages as columns, for a wide card with a few stages.
   */
  variant?: 'horizontal' | 'vertical' | undefined;
  format?: FunnelChartProps['format'];
  currency?: string | undefined;
  locale?: string | undefined;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | 4 | undefined;
  messages?: Partial<FunnelCardMessages> | undefined;
  chartMessages?: FunnelChartProps['messages'];
  className?: string | undefined;
}

/**
 * A funnel in a card, read top down: the end to end conversion as the headline with its change in
 * points, the step that loses the most named in words, then every stage with its figure, share and
 * drop-off. The chart's table twin lists the same figures.
 */
export function FunnelCard({
  stages,
  previous,
  title,
  comparison,
  variant = 'horizontal',
  format,
  currency,
  locale: requestedLocale,
  loading,
  messages,
  chartMessages,
  ...card
}: FunnelCardProps) {
  const m = mergeMessages(FUNNEL_CARD_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const insight = funnelInsight(stages, previous);
  const percent = (value: number) =>
    formatValue(value, 'percent', { locale, maximumFractionDigits: 1 });
  // No headline while loading, or with no first stage to convert from (unknown, not 0%).
  const conversion = loading === true ? null : insight.conversion;
  const empty = conversion === null;
  return (
    <ChartCard
      {...card}
      title={title ?? m.title}
      loading={loading}
      {...(conversion === null
        ? {}
        : {
            value: (
              <span className="inline-flex items-baseline gap-2">
                {percent(conversion)}
                <span className="text-sm font-normal text-fg-muted">{m.conversion}</span>
              </span>
            ),
            delta:
              insight.change === null ? undefined : (
                <TrendChip
                  value={insight.change}
                  format="points"
                  locale={locale}
                  comparison={comparison ?? m.vsBefore}
                />
              ),
          })}
    >
      <div className="flex flex-col gap-4">
        {!empty && insight.biggestDrop !== null && (
          <p className="text-sm text-fg">
            {m.biggestDrop({
              from: insight.biggestDrop.from,
              to: insight.biggestDrop.label,
              lost: percent(insight.biggestDrop.lost),
            })}
          </p>
        )}
        <FunnelChart
          data={stages}
          orientation={variant}
          format={format}
          currency={currency}
          locale={locale}
          loading={loading}
          messages={chartMessages}
        />
      </div>
    </ChartCard>
  );
}
