import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { Line, LineChart, YAxis } from 'recharts';

import { useBlockParts } from '../lib/block-parts';
import { chartColor } from '../lib/chart';
import { MINUS, formatPercent, resolveLocale } from '../lib/finance';
import { mergeMessages } from '../lib/messages';
import { formatValue } from '../lib/value-format';
import { kpiDelta, type Kpi } from './kpi-row.logic';

export interface KpiRowMessages {
  /** Names the row for assistive technology when `label` is not given. */
  label: string;
  /** The change of a figure that had no previous value. */
  new: string;
  /** A change in percentage points: "+2.1 pts". `points` is already formatted with its sign. */
  points: (points: string) => string;
  /** The words after a favourable change, such as "better". */
  better: string;
  /** The words after an unfavourable change, such as "worse". */
  worse: string;
  /** Read by screen readers after a change of zero. */
  noChange: string;
}

export const KPI_ROW_MESSAGES: KpiRowMessages = {
  label: 'Key figures',
  new: 'New',
  points: (points) => `${points} pts`,
  better: 'better',
  worse: 'worse',
  noChange: 'no change',
};

export interface KpiRowProps {
  kpis: readonly Kpi[];
  /** The currency of `money` figures. */
  currency: string;
  locale?: string;
  /** What the change is measured against, such as "vs February". */
  comparison: string;
  /** Names the row for assistive technology, such as "Key figures, March 2026". */
  label?: string;
  /** The block's words; pass the keys you change. See `KPI_ROW_MESSAGES`. */
  messages?: Partial<KpiRowMessages>;
  className?: string;
}

const ARROW = { up: ArrowUpRightIcon, down: ArrowDownRightIcon, flat: ArrowRightIcon };

function formatPoints(change: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  })
    .format(change * 100)
    .replace('-', MINUS);
}

/** A line of the recent periods, decorative: the figure and its change say the same in words. */
function Sparkline({
  series,
  favourable,
}: {
  series: readonly number[];
  favourable: boolean | null;
}) {
  const { ChartStage } = useBlockParts();
  const data = series.map((value, index) => ({ index, value }));
  return (
    <ChartStage className="h-9 w-24 shrink-0">
      <div aria-hidden className="h-full w-full">
        <LineChart
          responsive
          data={data}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          accessibilityLayer={false}
          style={{ width: '100%', height: '100%' }}
        >
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            dataKey="value"
            stroke={chartColor(favourable === false ? 'series-2' : 'series-1')}
            strokeWidth={1.75}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </ChartStage>
  );
}

/**
 * The few figures a finance lead reads first: each with its change against the previous period and
 * a sparkline of recent periods. The change says its direction with an arrow, a sign and words,
 * and whether it is good news with its colour, never with colour alone.
 */
export function KpiRow({
  kpis,
  currency,
  locale: requestedLocale,
  comparison,
  label,
  messages,
  className,
}: KpiRowProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(KPI_ROW_MESSAGES, messages);
  const { Money, Reveal } = useBlockParts();
  return (
    <section
      aria-label={label ?? m.label}
      data-slot="block"
      className={cn('@container', className)}
    >
      <Reveal>
        <dl
          className={cn(
            'grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line',
            '@xl:grid-cols-2 @5xl:grid-flow-col @5xl:auto-cols-fr @5xl:grid-cols-none',
          )}
        >
          {kpis.map((kpi) => {
            const delta = kpiDelta(kpi);
            const Arrow = ARROW[delta.direction];
            const change =
              delta.change === null
                ? m.new
                : kpi.format === 'percent'
                  ? m.points(formatPoints(delta.change, locale))
                  : formatPercent(delta.change, locale, { signed: true });
            const verdict = delta.favourable === true ? m.better : m.worse;
            return (
              <div
                key={kpi.id}
                className="flex min-w-0 flex-col gap-2 bg-surface px-5 py-4 @xl:last:odd:col-span-2 @5xl:last:odd:col-span-1"
              >
                <dt className="text-sm text-fg-muted">{kpi.label}</dt>
                <dd className="flex items-end justify-between gap-3">
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    {kpi.format === 'money' || kpi.format === 'currency' ? (
                      <Money
                        amount={kpi.value}
                        currency={currency}
                        locale={locale}
                        quietCurrency
                        className="text-2xl font-strong tracking-tight"
                      />
                    ) : (
                      <span className="text-2xl font-strong tracking-tight numeric">
                        {formatValue(kpi.value, kpi.format, { locale })}
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 font-medium',
                          delta.favourable === true && 'text-positive-strong',
                          delta.favourable === false && 'text-negative-strong',
                          delta.favourable === null && 'text-fg-muted',
                        )}
                      >
                        <Arrow aria-hidden weight="bold" className="size-3.5" />
                        <span className="numeric">{change}</span>
                        {delta.favourable === null && (
                          <span className="sr-only">, {m.noChange}</span>
                        )}
                        {/* Good or bad news in words too, never in colour alone. */}
                        {delta.favourable !== null && (
                          <span className="font-regular">
                            <span className="sr-only">,</span> {verdict}
                          </span>
                        )}
                      </span>
                      <span className="text-fg-muted">{comparison}</span>
                    </span>
                  </span>
                  <Sparkline series={kpi.series} favourable={delta.favourable} />
                </dd>
              </div>
            );
          })}
        </dl>
      </Reveal>
    </section>
  );
}
