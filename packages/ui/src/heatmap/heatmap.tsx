'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import {
  CHART_MESSAGES,
  ChartDataTable,
  ChartFrame,
  HATCH,
  mergeMessages,
  useElementWidth,
  useMarkGlide,
  type ChartMessages,
} from '../chart/chart';
import { extent, formatValue, type ValueFormat } from '../chart/chart-format';
import { cn } from '../lib/cn';

/** One cell of a matrix heatmap. `null` is a measurement that is missing, drawn hatched. */
export interface HeatmapCell {
  row: string;
  column: string;
  value: number | null;
}

/** A row or column of a matrix heatmap. */
export interface HeatmapAxisItem {
  id: string;
  label: string;
}

/** One day of a calendar heatmap. `null` is a day whose figure is missing. */
export interface HeatmapDay {
  date: Date;
  value: number | null;
}

export interface HeatmapMessages extends ChartMessages {
  /** A missing figure: in the legend, the readout and the table. */
  noData: string;
  tableCaption: string;
  /** The first column of the calendar's table. */
  weekHeader: string;
  /** A week row of the calendar's table, and the column name read out on a cell. */
  weekOf: (date: string) => string;
  /** The legend's low end and high end, for screen readers. */
  scale: (info: { steps: number; max: string }) => string;
  summary: (info: {
    count: number;
    total: string;
    highest?: { label: string; value: string } | undefined;
    missing: number;
  }) => string;
}

export const HEATMAP_MESSAGES: HeatmapMessages = {
  ...CHART_MESSAGES,
  noData: 'No data',
  tableCaption: 'Every cell of the heatmap',
  weekHeader: 'Week',
  weekOf: (date) => `Week of ${date}`,
  scale: ({ steps, max }) =>
    `Darker steps hold more, in ${String(steps)} even steps from zero up to ${max}.`,
  keyboardHint: 'Use the arrow keys in the grid to read each cell, or show the table.',
  summary: ({ count, total, highest, missing }) =>
    `${String(count)} cells, ${total} in all.` +
    (highest === undefined ? '' : ` Highest: ${highest.label} at ${highest.value}.`) +
    (missing === 0
      ? ''
      : ` ${String(missing)} ${missing === 1 ? 'cell has' : 'cells have'} no data.`),
};

interface HeatmapCommonProps {
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /** How many colour steps the figures fall into: 3, 4 or 5 (the default). */
  steps?: 3 | 4 | 5 | undefined;
  /** The top of the scale; the largest figure by default. Pass it to compare heatmaps side by side. */
  max?: number | undefined;
  /**
   * Print each figure in its cell. By default a matrix prints them when every column has room and a
   * calendar never does; the readout, the summary and the table give every figure either way.
   */
  showValues?: boolean | undefined;
  /** Names the grid for screen readers, such as `Commits by day`. */
  label?: string | undefined;
  summary?: string | undefined;
  loading?: boolean | undefined;
  emptyAction?: ReactNode;
  tableToggle?: boolean | undefined;
  messages?: Partial<HeatmapMessages> | undefined;
  className?: string | undefined;
}

export interface HeatmapMatrixProps extends HeatmapCommonProps {
  /** Rows by columns: hours by weekday, cohorts by month, regions by product. */
  variant?: 'matrix' | undefined;
  rows: readonly HeatmapAxisItem[];
  columns: readonly HeatmapAxisItem[];
  /** A pair with no cell here is left empty, apart from a missing figure (`null`) and from zero. */
  data: readonly HeatmapCell[];
  /** The header of the row labels in the table, such as `Cohort`. */
  rowHeader?: string | undefined;
}

export interface HeatmapCalendarProps extends HeatmapCommonProps {
  /** Days in weeks, from the first day in `data` to the last. A day with no entry reads as missing. */
  variant: 'calendar';
  data: readonly HeatmapDay[];
  /** The first day of the week: 1 Monday (the default) or 0 Sunday. */
  weekStartsOn?: 0 | 1 | undefined;
}

export type HeatmapProps = HeatmapMatrixProps | HeatmapCalendarProps;

interface Axis {
  id: string;
  /** The full name, read out on every cell. */
  label: string;
  /** What the axis prints; empty prints nothing (the full name stays for screen readers). */
  short: string;
}

interface Cell {
  /** The full name of the cell: `Mon, 3 Mar 2026`, or `Jan cohort, Month 2`. */
  title: string;
  value: number | null;
}

interface Model {
  rows: Axis[];
  columns: Axis[];
  /** Rows by columns; undefined is no cell at all (outside the calendar's range, or not given). */
  cells: (Cell | undefined)[][];
}

const dayKey = (date: Date) =>
  `${String(date.getFullYear())}-${String(date.getMonth())}-${String(date.getDate())}`;

/** The calendar as weekdays down and weeks across, every day from the first to the last. */
function calendarModel(
  days: readonly HeatmapDay[],
  weekStartsOn: 0 | 1,
  locale: string | undefined,
  m: HeatmapMessages,
): Model {
  const known = days.filter((day) => Number.isFinite(day.date.getTime()));
  if (known.length === 0) return { rows: [], columns: [], cells: [] };
  const { min, max } = extent(known.map((day) => day.date.getTime()));
  const startDay = new Date(min);
  const first = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate());
  const endDay = new Date(max);
  const last = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate());
  // Back to the first day of its week; calendar days, so a clock change never shifts a column.
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() - weekStartsOn + 7) % 7));
  const at = (offset: number) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
  let weeks = 0;
  while (at(weeks * 7) <= last) weeks += 1;

  const values = new Map(known.map((day) => [dayKey(day.date), day.value]));
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const month = new Intl.DateTimeFormat(locale, { month: 'short' });
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const full = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Every other weekday prints its name, so the labels breathe beside small cells.
  const rows = Array.from({ length: 7 }, (_, index) => {
    const name = weekday.format(at(index));
    return { id: `d${String(index)}`, label: name, short: index % 2 === 0 ? name : '' };
  });
  const columns = Array.from({ length: weeks }, (_, week) => {
    const monday = at(week * 7);
    // A month prints over the week its first day falls in, and over the first week when that is
    // more than two weeks before the next month's name, so two names never collide.
    const startsMonth = Array.from({ length: 7 }, (_, d) => at(week * 7 + d)).some(
      (date) => date.getDate() === 1,
    );
    const firstNamed = week === 0 && at(13).getMonth() === monday.getMonth();
    const named = startsMonth ? at(week * 7 + 6) : monday;
    return {
      id: `w${String(week)}`,
      label: m.weekOf(dayMonth.format(monday)),
      short: startsMonth || firstNamed ? month.format(named) : '',
    };
  });
  const cells = rows.map((_, d) =>
    columns.map((__, w) => {
      const date = at(w * 7 + d);
      if (date < first || date > last) return undefined;
      const value = values.get(dayKey(date));
      return {
        title: full.format(date),
        value: value === undefined || (value !== null && !Number.isFinite(value)) ? null : value,
      };
    }),
  );
  return { rows, columns, cells };
}

function matrixModel(props: HeatmapMatrixProps): Model {
  const values = new Map(props.data.map((cell) => [`${cell.row}\u0000${cell.column}`, cell.value]));
  const rows = props.rows.map((row) => ({ ...row, short: row.label }));
  const columns = props.columns.map((column) => ({ ...column, short: column.label }));
  const cells = rows.map((row) =>
    columns.map((column) => {
      const key = `${row.id}\u0000${column.id}`;
      if (!values.has(key)) return undefined;
      const value = values.get(key) ?? null;
      return {
        title: `${row.label}, ${column.label}`,
        value: value !== null && Number.isFinite(value) ? value : null,
      };
    }),
  );
  return { rows, columns, cells };
}

/** The sequence tokens a heatmap with this many steps uses, spread so neighbours stay far apart. */
const STEP_TOKENS: Record<3 | 4 | 5, readonly number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
};

const STEP_CLASS: Record<number, string> = {
  1: 'bg-chart-sequence-1 text-chart-on-sequence-1',
  2: 'bg-chart-sequence-2 text-chart-on-sequence-2',
  3: 'bg-chart-sequence-3 text-chart-on-sequence-3',
  4: 'bg-chart-sequence-4 text-chart-on-sequence-4',
  5: 'bg-chart-sequence-5 text-chart-on-sequence-5',
};

/**
 * The step of a figure: 0 for zero (and below), then 1 to `steps` in even bands up to `max`, so a
 * figure at the top of the scale takes the last step.
 */
export function heatStep(value: number, max: number, steps: number): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(steps, Math.max(1, Math.ceil((value / max) * steps)));
}

const ZERO_CELL = 'bg-surface-sunken text-fg-muted inset-ring inset-ring-line';
const MISSING_CELL = 'bg-chart-reference/40 text-fg-muted';

/**
 * Figures over two dimensions as a grid of coloured cells: activity by day across a year
 * (`variant="calendar"`), or any rows by columns such as cohorts by month or hours by weekday
 * (`variant="matrix"`). A sequential scale from the chart sequence tokens, with zero and missing
 * figures drawn apart from it and from each other. The grid is read cell by cell with the arrow
 * keys, and the summary and table give every figure without the colours.
 */
export function Heatmap(props: HeatmapProps) {
  const {
    format = 'number',
    currency,
    locale,
    steps = 5,
    label,
    summary,
    loading,
    emptyAction,
    tableToggle,
    messages,
    className,
  } = props;
  const m = mergeMessages(HEATMAP_MESSAGES, messages);
  const glide = useMarkGlide();
  const calendar = props.variant === 'calendar';
  const model = calendar
    ? calendarModel(props.data, props.weekStartsOn ?? 1, locale, m)
    : matrixModel(props);
  const write = (value: number) => formatValue(value, format, { locale, currency });
  const shortWrite = (value: number) =>
    formatValue(value, format, { locale, currency, compact: true });

  const present = model.cells.flatMap((row) =>
    row.filter((cell): cell is Cell => cell !== undefined),
  );
  const figures = present.flatMap((cell) => (cell.value === null ? [] : [cell.value]));
  const max = props.max ?? Math.max(0, extent(figures).max);
  const tokens = STEP_TOKENS[steps];
  const stepClass = (value: number | null) => {
    if (value === null) return MISSING_CELL;
    const step = heatStep(value, max, steps);
    return step === 0 ? ZERO_CELL : (STEP_CLASS[tokens[step - 1] ?? 1] ?? '');
  };
  const readValue = (value: number | null) => (value === null ? m.noData : write(value));

  // Start on the latest figure of a calendar, the first cell of a matrix.
  const firstCell = (() => {
    const order = calendar
      ? model.columns.flatMap((_, c) => model.rows.map((__, r) => [r, c] as const)).reverse()
      : model.rows.flatMap((_, r) => model.columns.map((__, c) => [r, c] as const));
    return order.find(([r, c]) => model.cells[r]?.[c] !== undefined) ?? ([0, 0] as const);
  })();
  const [active, setActive] = useState<readonly [number, number] | null>(null);
  const [hover, setHover] = useState<readonly [number, number] | null>(null);
  const [focused, setFocused] = useState(false);
  const current = active ?? firstCell;
  const refs = useRef(new Map<string, HTMLDivElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scroller);

  // A year of days is wider than a phone: the grid scrolls inside itself and opens on the latest week.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element !== null && calendar) element.scrollLeft = element.scrollWidth;
  }, [calendar, model.columns.length]);

  const columnCount = model.columns.length;
  // Room to print a figure: about a short figure's width per column, after the row labels.
  const showValues =
    props.showValues ?? (!calendar && columnCount > 0 && (width - 96) / columnCount >= 40);

  const move = (r: number, c: number, dr: number, dc: number): readonly [number, number] | null => {
    let row = r + dr;
    let column = c + dc;
    while (row >= 0 && row < model.rows.length && column >= 0 && column < columnCount) {
      if (model.cells[row]?.[column] !== undefined) return [row, column];
      row += dr;
      column += dc;
    }
    return null;
  };
  const rowEnd = (r: number, fromEnd: boolean): readonly [number, number] | null => {
    const indices = model.columns.map((_, c) => c);
    const found = (fromEnd ? indices.reverse() : indices).find(
      (c) => model.cells[r]?.[c] !== undefined,
    );
    return found === undefined ? null : [r, found];
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const [r, c] = current;
    const next =
      event.key === 'ArrowRight'
        ? move(r, c, 0, 1)
        : event.key === 'ArrowLeft'
          ? move(r, c, 0, -1)
          : event.key === 'ArrowDown'
            ? move(r, c, 1, 0)
            : event.key === 'ArrowUp'
              ? move(r, c, -1, 0)
              : event.key === 'Home'
                ? rowEnd(event.ctrlKey ? 0 : r, false)
                : event.key === 'End'
                  ? rowEnd(event.ctrlKey ? model.rows.length - 1 : r, true)
                  : undefined;
    if (next === undefined) return;
    event.preventDefault();
    if (next === null) return;
    setActive(next);
    refs.current.get(`${String(next[0])}-${String(next[1])}`)?.focus();
  };

  const read = hover ?? (focused ? current : null);
  const readCell = read === null ? undefined : model.cells[read[0]]?.[read[1]];

  let highest: { label: string; value: number } | undefined;
  for (const cell of present) {
    if (cell.value !== null && (highest === undefined || cell.value > highest.value))
      highest = { label: cell.title, value: cell.value };
  }
  const missing = present.filter((cell) => cell.value === null).length;
  const written =
    summary ??
    [
      m.summary({
        count: present.length,
        total: write(figures.reduce((sum, value) => sum + value, 0)),
        highest:
          highest === undefined ? undefined : { label: highest.label, value: write(highest.value) },
        missing,
      }),
      m.scale({ steps, max: write(max) }),
      m.keyboardHint,
    ].join(' ');

  // The table: weeks down for a calendar (a row a week), rows down for a matrix.
  const table = calendar
    ? {
        headers: [m.weekHeader, ...model.rows.map((row) => row.label)],
        rows: model.columns.map((column, c) => ({
          key: column.id,
          header: column.label,
          cells: model.rows.map((_, r) => {
            const cell = model.cells[r]?.[c];
            return cell === undefined ? '' : readValue(cell.value);
          }),
        })),
      }
    : {
        headers: [props.rowHeader ?? '', ...model.columns.map((column) => column.label)],
        rows: model.rows.map((row, r) => ({
          key: row.id,
          header: row.label,
          cells: model.columns.map((_, c) => {
            const cell = model.cells[r]?.[c];
            return cell === undefined ? '' : readValue(cell.value);
          }),
        })),
      };

  const legend = (
    <div
      data-slot="heatmap-legend"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-muted"
    >
      <span className="sr-only">{m.scale({ steps, max: write(max) })}</span>
      <span aria-hidden className="inline-flex items-center gap-1.5 numeric">
        <span className={cn('size-3 rounded-badge', ZERO_CELL)} />
        {write(0)}
        <span className="ms-2 inline-flex gap-0.5">
          {tokens.map((token) => (
            <span key={token} className={cn('size-3 rounded-badge', STEP_CLASS[token])} />
          ))}
        </span>
        {write(max)}
      </span>
      {missing > 0 && (
        <span aria-hidden className="inline-flex items-center gap-1.5">
          <span
            className={cn('size-3 rounded-badge', MISSING_CELL)}
            style={{ backgroundImage: HATCH }}
          />
          {m.noData}
        </span>
      )}
    </div>
  );

  return (
    <ChartFrame
      kind="heatmap"
      loading={loading}
      empty={present.length === 0}
      emptyAction={emptyAction}
      summary={written}
      tableToggle={tableToggle}
      plotClassName={loading === true || present.length === 0 ? 'h-40' : 'h-auto'}
      messages={m}
      className={className}
      table={<ChartDataTable caption={m.tableCaption} headers={table.headers} rows={table.rows} />}
    >
      <div className="flex flex-col gap-3">
        {legend}
        <div ref={scroller} className="-mx-1 overflow-x-auto px-1 pt-1 pb-2">
          <div
            role="grid"
            aria-readonly
            aria-label={label ?? m.tableCaption}
            aria-rowcount={model.rows.length + 1}
            aria-colcount={columnCount + 1}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
            }}
            onPointerLeave={() => {
              setHover(null);
            }}
            data-chart-mark="reveal"
            className={cn('rx-mark grid min-w-full', calendar ? 'w-max gap-0.5' : 'gap-1')}
            style={{
              gridTemplateColumns: calendar
                ? `auto repeat(${String(columnCount)}, minmax(calc(var(--spacing) * 2.5), 1fr))`
                : `auto repeat(${String(columnCount)}, minmax(calc(var(--spacing) * 6), 1fr))`,
            }}
          >
            <div role="row" className="contents">
              <div role="columnheader" />
              {model.columns.map((column) => (
                <div
                  key={column.id}
                  role="columnheader"
                  className={cn(
                    'min-w-0 text-xs whitespace-nowrap text-fg-muted',
                    calendar ? 'overflow-visible pb-1' : 'truncate pb-1 text-center',
                  )}
                >
                  <span aria-hidden>{column.short}</span>
                  <span className="sr-only">{column.label}</span>
                </div>
              ))}
            </div>
            {model.rows.map((row, r) => (
              <div key={row.id} role="row" className="contents">
                <div
                  role="rowheader"
                  className={cn(
                    'flex items-center pe-2 text-xs whitespace-nowrap text-fg-muted',
                    calendar && 'leading-none',
                  )}
                >
                  <span aria-hidden>{row.short}</span>
                  <span className="sr-only">{row.label}</span>
                </div>
                {model.columns.map((column, c) => {
                  const cell = model.cells[r]?.[c];
                  if (cell === undefined) return <div key={column.id} role="gridcell" />;
                  const isCurrent = current[0] === r && current[1] === c;
                  const isRead = read !== null && read[0] === r && read[1] === c;
                  return (
                    <div
                      key={column.id}
                      role="gridcell"
                      ref={(element) => {
                        const key = `${String(r)}-${String(c)}`;
                        if (element === null) refs.current.delete(key);
                        else refs.current.set(key, element);
                      }}
                      tabIndex={isCurrent ? 0 : -1}
                      onFocus={() => {
                        setActive([r, c]);
                      }}
                      onPointerEnter={() => {
                        setHover([r, c]);
                      }}
                      className={cn(
                        'relative flex items-center justify-center rounded-badge text-xs numeric',
                        calendar ? 'aspect-square' : 'h-8 px-1',
                        'outline-offset-1 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-focus',
                        isRead && 'z-10 outline-2 outline-fg',
                        stepClass(cell.value),
                        glide,
                      )}
                      style={cell.value === null ? { backgroundImage: HATCH } : undefined}
                    >
                      <span className="sr-only">
                        {calendar ? cell.title : `${row.label}, ${column.label}`}:{' '}
                        {readValue(cell.value)}
                      </span>
                      {showValues && cell.value !== null && (
                        <span aria-hidden className="truncate font-medium">
                          {shortWrite(cell.value)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* The cell under the pointer or the keyboard, for sighted readers; a cell reads itself out. */}
        <p aria-hidden className="m-0 min-h-5 text-sm text-fg-muted numeric">
          {readCell !== undefined && (
            <>
              <span className="text-fg">{readCell.title}</span>
              {': '}
              <span className="font-strong text-fg">{readValue(readCell.value)}</span>
            </>
          )}
        </p>
      </div>
    </ChartFrame>
  );
}
