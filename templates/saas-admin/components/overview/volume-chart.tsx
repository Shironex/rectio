'use client';

import { TableIcon } from '@phosphor-icons/react';
import {
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useId, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';

import type { VolumeDay } from '@/data/overview';
import { formatCount, formatShortDate } from '@/data/workspace';

const CREATED = 'var(--rx-chart-series-1)';
const RESOLVED = 'var(--rx-chart-series-3)';

/** Axis text and gridlines from the chart tokens; CSS outranks the attributes Recharts writes. */
const SURFACE = cn(
  'text-xs [&_.recharts-cartesian-axis-tick-value]:fill-chart-axis',
  '[&_.recharts-text]:font-numeric [&_.recharts-text]:tabular-nums',
  '[&_.recharts-cartesian-grid_line]:stroke-chart-grid',
  '[&_.recharts-surface]:outline-none [&_.recharts-wrapper]:rounded-control',
  '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-2',
  '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-offset-2',
  '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-focus',
);

function Key({ color, line = false }: { color: 'created' | 'resolved'; line?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block shrink-0',
        line ? 'h-0.5 w-3.5 rounded-full' : 'size-2.5 rounded-badge',
        color === 'created' ? 'bg-chart-series-1' : 'bg-chart-series-3',
      )}
    />
  );
}

interface Datum {
  label: string;
  date: Date;
  created: number;
  resolved: number;
}

function VolumeTooltip(props: TooltipContentProps & { data: readonly Datum[] }) {
  const index = Number(props.activeIndex);
  const datum = props.active && Number.isInteger(index) ? props.data[index] : undefined;
  if (datum === undefined) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-control border border-chart-tooltip-border bg-chart-tooltip px-3 py-2 text-sm whitespace-nowrap text-fg shadow-overlay">
      <p className="font-medium">{formatShortDate(datum.date)}</p>
      <span className="inline-flex items-center gap-1.5 text-fg-muted">
        <Key color="created" />
        Created <span className="text-fg numeric">{formatCount(datum.created)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-fg-muted">
        <Key color="resolved" line />
        Resolved <span className="text-fg numeric">{formatCount(datum.resolved)}</span>
      </span>
    </div>
  );
}

/**
 * Tickets created (bars) against tickets resolved (a line) per day, with the same figures as a
 * table that is always in the page for screen readers and shown on request.
 */
export function VolumeChart({
  days,
  className,
}: {
  days: readonly VolumeDay[];
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const data: Datum[] = days.map((d) => ({ ...d, label: formatShortDate(d.date) }));
  const created = days.reduce((sum, d) => sum + d.created, 0);
  const resolved = days.reduce((sum, d) => sum + d.resolved, 0);
  const peak = days.reduce<VolumeDay | undefined>(
    (top, d) => (top === undefined || d.created > top.created ? d : top),
    undefined,
  );

  return (
    <figure className={cn('m-0 flex min-w-0 flex-col gap-3', className)}>
      <figcaption className="sr-only">
        {`${formatCount(created)} tickets created and ${formatCount(resolved)} resolved over ${String(days.length)} days.`}
        {peak === undefined ? '' : ` The busiest day was ${formatShortDate(peak.date)}.`}
      </figcaption>
      <div className="flex items-start justify-between gap-x-4">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-sm text-fg-muted">
          <li className="inline-flex items-center gap-1.5">
            <Key color="created" />
            Created
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Key color="resolved" line />
            Resolved
          </li>
        </ul>
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
          {showTable ? 'Hide table' : 'Show table'}
        </Button>
      </div>
      <div className={cn('relative h-60 min-w-0', SURFACE)}>
        <ComposedChart
          responsive
          accessibilityLayer
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          style={{ width: '100%', height: '100%' }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            width="auto"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            allowDecimals={false}
          />
          <Tooltip
            content={(props) => <VolumeTooltip {...props} data={data} />}
            cursor={{ fill: 'var(--rx-surface-hover)' }}
            position={{ y: -44 }}
            allowEscapeViewBox={{ x: false, y: true }}
            offset={16}
            isAnimationActive={false}
          />
          <Bar
            dataKey="created"
            name="Created"
            fill={CREATED}
            radius={[2, 2, 0, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          />
          <Line
            dataKey="resolved"
            tooltipType="none"
            legendType="none"
            stroke="var(--rx-chart-halo)"
            strokeWidth={6}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="resolved"
            name="Resolved"
            stroke={RESOLVED}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: RESOLVED }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </div>
      <div id={tableId} className={cn(!showTable && 'sr-only')}>
        <Table>
          <TableCaption className="sr-only">Tickets created and resolved per day</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead align="end">Created</TableHead>
              <TableHead align="end">Resolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.label}>
                <TableHead scope="row" className="h-auto bg-transparent font-normal text-fg">
                  {d.label}
                </TableHead>
                <TableCell align="end" className="numeric">
                  {formatCount(d.created)}
                </TableCell>
                <TableCell align="end" className="numeric">
                  {formatCount(d.resolved)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </figure>
  );
}
