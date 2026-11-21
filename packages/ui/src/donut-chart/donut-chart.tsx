'use client';

import { useState, type ReactNode } from 'react';
import {
  Pie,
  PieChart,
  Sector,
  Tooltip,
  type PieSectorShapeProps,
  type TooltipContentProps,
} from 'recharts';

import {
  CHART_MESSAGES,
  ChartDataTable,
  ChartFrame,
  CHART_PALETTE,
  ChartTooltip,
  Swatch,
  chartColor,
  mergeMessages,
  paletteColor,
  useMarkAnimation,
  type ChartColor,
  type ChartMessages,
} from '../chart/chart';
import { formatValue, type ValueFormat } from '../chart/chart-format';
import { cn } from '../lib/cn';

export interface DonutSlice {
  /** Stable key for the slice. */
  id: string;
  label: string;
  /** Its figure. Zero and negative figures cannot be a share of a whole and are left out. */
  value: number;
  color?: ChartColor | undefined;
}

export interface DonutChartMessages extends ChartMessages {
  /** The slice that gathers the smallest ones past `maxSlices`. */
  other: string;
  /** A table row for a slice folded into Other. */
  inOther: (label: string) => string;
  /** Under the figure in the middle, and the table's last row. */
  total: string;
  share: string;
  valueHeader: string;
  categoryHeader: string;
  tableCaption: string;
  /** The summary, read before the plot. `parts` lists each slice with its share. */
  summary: (info: { total: string; parts: string }) => string;
}

export const DONUT_CHART_MESSAGES: DonutChartMessages = {
  ...CHART_MESSAGES,
  other: 'Other',
  inOther: (label) => `${label}, in Other`,
  total: 'Total',
  share: 'Share',
  valueHeader: 'Value',
  categoryHeader: 'Category',
  tableCaption: 'Shares of the total',
  keyboardHint: 'The list beside the chart gives every figure, or show the table.',
  summary: ({ total, parts }) => `A total of ${total}: ${parts}.`,
};

export interface DonutChartProps {
  data: readonly DonutSlice[];
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /**
   * Most slices drawn; the smallest past it join one Other slice. Four by default and at most:
   * the three series colours and Other in the reference colour, all apart for every colour
   * vision type. Only when every slice brings its own colour can there be more.
   */
  maxSlices?: number | undefined;
  /** The figure in the middle. The total by default; pass null for an empty middle. */
  centerValue?: ReactNode;
  /** The words under it. `Total` by default. */
  centerLabel?: ReactNode;
  summary?: string | undefined;
  loading?: boolean | undefined;
  emptyAction?: ReactNode;
  tableToggle?: boolean | undefined;
  /** Height of the plot, a token utility such as `h-48` (the default). */
  plotClassName?: string | undefined;
  messages?: Partial<DonutChartMessages> | undefined;
  className?: string | undefined;
}

interface Part {
  id: string;
  label: string;
  value: number;
  share: number;
  tone: ChartColor;
}

/**
 * The slices to draw: positive figures, the smallest folded into Other past `max`. Without a
 * colour on every slice, at most the palette's three plus Other, so no colour repeats.
 */
function partsOf(
  data: readonly DonutSlice[],
  max: number,
  other: string,
): { parts: Part[]; folded: Part[] } {
  const positive = data.filter((slice) => Number.isFinite(slice.value) && slice.value > 0);
  const total = positive.reduce((sum, slice) => sum + slice.value, 0);
  const coloured = positive.every((slice) => slice.color !== undefined);
  const limit = Math.max(2, Math.floor(max));
  const room = coloured ? limit : Math.min(limit, CHART_PALETTE.length + 1);
  const fold = positive.length > room || (!coloured && positive.length > CHART_PALETTE.length);
  let kept: DonutSlice[] = positive;
  let rest: DonutSlice[] = [];
  if (fold) {
    const count = coloured ? room - 1 : Math.min(room - 1, CHART_PALETTE.length);
    const ranked = [...positive].sort((a, b) => b.value - a.value);
    const keep = new Set(ranked.slice(0, count).map((slice) => slice.id));
    kept = positive.filter((slice) => keep.has(slice.id));
    rest = positive.filter((slice) => !keep.has(slice.id));
  }
  const share = (value: number) => (total === 0 ? 0 : value / total);
  const parts: Part[] = kept.map((slice, index) => ({
    id: slice.id,
    label: slice.label,
    value: slice.value,
    share: share(slice.value),
    tone: slice.color ?? paletteColor(index),
  }));
  const folded: Part[] = rest.map((slice) => ({
    id: slice.id,
    label: slice.label,
    value: slice.value,
    share: share(slice.value),
    tone: 'reference',
  }));
  if (rest.length > 0) {
    const value = rest.reduce((sum, slice) => sum + slice.value, 0);
    parts.push({ id: '__other', label: other, value, share: share(value), tone: 'reference' });
  }
  return { parts, folded };
}

/**
 * Parts of one whole as a ring, with the total in the middle and every part listed beside it by
 * name, figure and share, so the ring is a picture of the list rather than the only way to read it.
 * Small slices fold into Other, and a hairline of the surface separates neighbours.
 */
export function DonutChart({
  data,
  format = 'number',
  currency,
  locale,
  maxSlices = 4,
  centerValue,
  centerLabel,
  summary,
  loading,
  emptyAction,
  tableToggle,
  plotClassName = 'h-48',
  messages,
  className,
}: DonutChartProps) {
  const m = mergeMessages(DONUT_CHART_MESSAGES, messages);
  const animation = useMarkAnimation();
  const [active, setActive] = useState<number | null>(null);
  const write = (value: number, compact = false) =>
    formatValue(value, format, { locale, currency, compact });
  const percent = (share: number) => formatValue(share, 'percent', { locale });
  const { parts, folded } = partsOf(data, maxSlices, m.other);
  const total = parts.reduce((sum, part) => sum + part.value, 0);

  const tooltip = (props: TooltipContentProps) => {
    if (!props.active) return null;
    const part = parts[Number(props.activeIndex)];
    if (part === undefined) return null;
    return (
      <ChartTooltip
        title={part.label}
        rows={[
          { label: m.valueHeader, value: write(part.value), color: part.tone },
          { label: m.share, value: percent(part.share) },
        ]}
      />
    );
  };

  // The full figure when it fits the hole; a short form only for a long one.
  const full = write(total);
  const middle =
    centerValue === undefined ? (full.length <= 8 ? full : write(total, true)) : centerValue;

  return (
    <ChartFrame
      kind="donut"
      loading={loading}
      empty={parts.length === 0}
      emptyAction={emptyAction}
      summary={
        summary ??
        [
          m.summary({
            total: write(total),
            parts: parts
              .map((part) => `${part.label} ${write(part.value)} (${percent(part.share)})`)
              .join(', '),
          }),
          m.keyboardHint,
        ].join(' ')
      }
      tableToggle={tableToggle}
      // The ring and its list size themselves; loading and empty states keep the ring's height.
      plotClassName={loading === true || parts.length === 0 ? plotClassName : '@container'}
      messages={m}
      className={className}
      table={
        <ChartDataTable
          caption={m.tableCaption}
          headers={[m.categoryHeader, m.valueHeader, m.share]}
          // The slices inside Other follow it, so the table still names every part.
          rows={[
            ...parts.map((part) => ({
              key: part.id,
              header: part.label,
              cells: [write(part.value), percent(part.share)],
            })),
            ...folded.map((part) => ({
              key: `other-${part.id}`,
              header: m.inOther(part.label),
              cells: [write(part.value), percent(part.share)],
            })),
          ]}
          footer={{ header: m.total, cells: [write(total), percent(1)] }}
        />
      }
    >
      <div className="flex flex-col items-center gap-5 @md:flex-row @md:gap-8">
        <div className={cn('relative aspect-square max-w-full shrink-0', plotClassName)}>
          <PieChart
            responsive
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            <Tooltip content={tooltip} isAnimationActive={false} offset={12} />
            <Pie
              data={parts}
              dataKey="value"
              nameKey="label"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={parts.length > 1 ? 1 : 0}
              cornerRadius={2}
              stroke="var(--rx-chart-halo)"
              strokeWidth={1}
              onMouseEnter={(_: unknown, index: number) => {
                setActive(index);
              }}
              onMouseLeave={() => {
                setActive(null);
              }}
              shape={(props: PieSectorShapeProps, at?: string | number) => {
                const index = Number(at);
                return (
                  <Sector
                    cx={props.cx}
                    cy={props.cy}
                    innerRadius={props.innerRadius}
                    outerRadius={props.outerRadius}
                    startAngle={props.startAngle}
                    endAngle={props.endAngle}
                    cornerRadius={2}
                    // The pale Other slice gets an axis coloured edge, so it holds 3:1 against the card.
                    {...(parts[index]?.tone === 'reference'
                      ? { stroke: 'var(--rx-chart-axis)', strokeWidth: 1 }
                      : { stroke: 'var(--rx-chart-halo)', strokeWidth: 2 })}
                    fill={chartColor(parts[index]?.tone ?? 'reference')}
                    className={cn(
                      'transition-opacity duration-fast ease-standard',
                      active !== null && active !== index && 'opacity-50',
                    )}
                  />
                );
              }}
              {...animation}
            />
          </PieChart>
          {middle !== null && (
            // Read from the list and the summary; the middle is the picture's label.
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <span
                className={cn(
                  'font-strong tracking-tight text-fg numeric',
                  // An amount takes the skin's money face, like every other amount in the kit.
                  format === 'currency' && 'font-(family-name:--rx-money-family)',
                  // A long figure steps down a size so it keeps clear of the ring.
                  typeof middle === 'string' && middle.length > 6 ? 'text-xl' : 'text-2xl',
                )}
              >
                {middle}
              </span>
              <span className="text-xs text-fg-muted">{centerLabel ?? m.total}</span>
            </div>
          )}
        </div>
        <dl data-slot="donut-legend" className="flex w-full min-w-0 flex-col gap-0.5 text-sm">
          {parts.map((part, index) => (
            <div
              key={part.id}
              onMouseEnter={() => {
                setActive(index);
              }}
              onMouseLeave={() => {
                setActive(null);
              }}
              className={cn(
                'flex items-center gap-3 rounded-control px-2 py-1.5',
                active === index && 'bg-surface-hover',
              )}
            >
              <dt className="inline-flex min-w-0 flex-1 items-center gap-2 text-fg-muted">
                <Swatch color={part.tone} />
                <span className="truncate">{part.label}</span>
              </dt>
              <dd className="text-end font-medium text-fg numeric">{write(part.value)}</dd>
              <dd className="w-14 shrink-0 text-end text-fg-muted numeric">
                {percent(part.share)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </ChartFrame>
  );
}
