import { TableIcon } from '@phosphor-icons/react';
import { Button, Money, cn } from '@rectio/ui';
import {
  ChartLegend,
  Swatch,
  TOOLTIP_LIFT,
  activeDatum,
  chartColor,
  chartSurface,
  niceTicks,
  type ChartColor,
  type LegendItem,
  type SwatchShape,
} from '@rectio/ui/charts';
import { useId, useState, type ReactNode } from 'react';

import { useBlockParts } from './block-parts';

// The shared chart parts live in the kit; blocks add the money tooltip and the block parts stage.
export {
  ChartLegend,
  Swatch,
  TOOLTIP_LIFT,
  activeDatum,
  chartColor,
  chartSurface,
  niceTicks,
  type ChartColor,
  type LegendItem,
  type SwatchShape,
};

export interface TooltipRow {
  label: ReactNode;
  amount: number;
  color?: ChartColor;
  shape?: SwatchShape;
  /** Bold the row, for a total or a net figure. */
  strong?: boolean;
}

export interface ChartTooltipProps {
  title: ReactNode;
  rows: readonly TooltipRow[];
  currency: string;
  locale: string;
  /**
   * `row` lays the figures out on one line, short enough to sit over the legend row above the
   * plot, so it never hides the marks or the summary figures above them. `stack` is a column.
   */
  layout?: 'stack' | 'row';
}

/**
 * Tooltip content in the theme: the period, then each figure by name with its legend key. Money
 * signs carry the direction, so the colour key is never the only cue.
 */
export function ChartTooltip({
  title,
  rows,
  currency,
  locale,
  layout = 'stack',
}: ChartTooltipProps) {
  const row = layout === 'row';
  return (
    <div
      className={cn(
        'flex rounded-control border border-chart-tooltip-border bg-chart-tooltip px-3 py-2',
        'text-sm text-fg shadow-overlay',
        row
          ? 'flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap'
          : 'min-w-44 flex-col gap-1.5',
      )}
    >
      <p className="font-medium">{title}</p>
      <dl className={cn('flex', row ? 'flex-wrap items-center gap-x-4 gap-y-1' : 'flex-col gap-1')}>
        {rows.map((item, index) => (
          <div
            key={index}
            className={cn('flex items-center gap-4', row ? 'gap-1.5' : 'justify-between')}
          >
            <dt className="inline-flex items-center gap-1.5 text-fg-muted">
              {item.color !== undefined && <Swatch color={item.color} shape={item.shape} />}
              {item.label}
            </dt>
            <dd className={cn('text-end', item.strong === true && 'font-strong')}>
              <Money amount={item.amount} currency={currency} locale={locale} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface ChartFigureProps {
  /** One or two sentences saying what the chart shows, read before the plot. */
  summary: string;
  legend?: readonly LegendItem[];
  /** The same figures as a table: always in the page for screen readers, shown on request. */
  table: ReactNode;
  /** Height of the plot, a token utility such as `h-64`. */
  plotClassName?: string;
  /** The toggle's words, from the block's messages. */
  showTableLabel?: string;
  hideTableLabel?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A chart with its legend, a toggle that shows the figures as a table, and that table. The table
 * stays in the accessibility tree while hidden, so the data never depends on seeing the plot.
 */
export function ChartFigure({
  summary,
  legend,
  table,
  plotClassName,
  showTableLabel = 'Show table',
  hideTableLabel = 'Hide table',
  children,
  className,
}: ChartFigureProps) {
  const { ChartStage } = useBlockParts();
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  return (
    <figure className={cn('m-0 flex min-w-0 flex-col gap-3', className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      {/* The legend wraps inside its own column, so the table switch keeps its place at the end. */}
      <div className="flex items-start justify-between gap-x-4">
        <div className="min-w-0 flex-1 pt-1.5">
          {legend !== undefined && <ChartLegend items={legend} />}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => {
            setShowTable((shown) => !shown);
          }}
          className="-me-2 shrink-0"
        >
          <TableIcon aria-hidden weight="bold" className="size-3.5" />
          {showTable ? hideTableLabel : showTableLabel}
        </Button>
      </div>
      <ChartStage className={cn('relative min-w-0', chartSurface, plotClassName)}>
        {children}
      </ChartStage>
      <div id={tableId} className={cn(!showTable && 'sr-only')}>
        {table}
      </div>
    </figure>
  );
}
