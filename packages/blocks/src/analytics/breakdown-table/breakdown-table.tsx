'use client';

import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon } from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TrendChip,
  cn,
} from '@rectio/ui';
import { formatValue, type ValueFormat } from '@rectio/ui/charts';
import { useId, useState, type ReactNode } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { resolveLocale } from '../../lib/finance';
import { mergeMessages, plural } from '../../lib/messages';
import {
  breakdownModel,
  type BreakdownItem,
  type BreakdownSort,
  type BreakdownSortKey,
} from './breakdown-table.logic';

export interface BreakdownTableMessages {
  title: string;
  labelHeader: string;
  valueHeader: string;
  shareHeader: string;
  changeHeader: string;
  total: string;
  /** The row that gathers the items past the limit. */
  other: (count: number) => string;
  showAll: (count: number) => string;
  showFewer: string;
  /** Shown when there are no items. */
  empty: string;
  /** In a change cell without a figure to compare with. */
  noChange: string;
}

export const BREAKDOWN_TABLE_MESSAGES: BreakdownTableMessages = {
  title: 'Breakdown',
  labelHeader: 'Name',
  valueHeader: 'Value',
  shareHeader: 'Share',
  changeHeader: 'Change',
  total: 'Total',
  other: (count) => plural(count, { one: '1 other', other: `${String(count)} others` }, 'en'),
  showAll: (count) => `Show all ${String(count)}`,
  showFewer: 'Show fewer',
  empty: 'Nothing to break down yet.',
  noChange: 'No earlier figure',
};

export interface BreakdownTableProps {
  items: readonly BreakdownItem[];
  title?: ReactNode;
  /** Under the title: the period and what is counted. */
  description?: ReactNode;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /**
   * `bars`, each row with a bar of its share against the largest, for a few rows read at a glance;
   * `compact`, figures only in tight rows, for a long list.
   */
  variant?: 'bars' | 'compact' | undefined;
  /** The order it opens in: largest first by default. */
  defaultSort?: BreakdownSort | undefined;
  /** Let the reader sort by each column. On by default. */
  sortable?: boolean | undefined;
  /** Rows shown before the rest gather into one; a button shows them all. 8 by default. */
  limit?: number | undefined;
  /** A totals row at the foot. On by default. */
  total?: boolean | undefined;
  /** What the change is against, for the column header's description: `vs last month`. */
  comparison?: string | undefined;
  /** Which way is good news, for the change's colour. Up by default. */
  better?: 'up' | 'down' | 'none' | undefined;
  /** Controls on the title row, such as a period switch. */
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | undefined;
  messages?: Partial<BreakdownTableMessages> | undefined;
  className?: string | undefined;
}

const SORT_WORDS = { true: 'ascending', false: 'descending' } as const;

function SortHead({
  column,
  sort,
  onSort,
  sortable,
  align = 'start',
  edge,
  children,
}: {
  column: BreakdownSortKey;
  sort: BreakdownSort;
  onSort: (key: BreakdownSortKey) => void;
  sortable: boolean;
  align?: 'start' | 'end';
  /** The first or last column, padded to the card's edge. */
  edge?: 'start' | 'end';
  children: ReactNode;
}) {
  const inset = edge === 'start' ? 'ps-5' : edge === 'end' ? 'pe-5' : undefined;
  if (!sortable) {
    return (
      <TableHead align={align} className={inset}>
        {children}
      </TableHead>
    );
  }
  const active = sort.key === column;
  const Icon = !active ? ArrowsDownUpIcon : sort.ascending ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead
      align={align}
      aria-sort={active ? SORT_WORDS[String(sort.ascending) as 'true' | 'false'] : 'none'}
      className="p-0"
    >
      <button
        type="button"
        data-sorted={active || undefined}
        onClick={() => {
          onSort(column);
        }}
        className={cn(
          'inline-flex h-full w-full cursor-pointer items-center gap-1.5 px-(--rx-table-cell-padding-x)',
          'font-medium whitespace-nowrap text-fg-muted hover:text-fg data-sorted:text-fg',
          'transition-colors duration-fast ease-standard',
          '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
          align === 'end' && 'justify-end',
          inset,
        )}
      >
        {children}
        <Icon
          aria-hidden
          weight="bold"
          className={cn('size-3.5 shrink-0', active ? 'text-fg' : 'text-fg-subtle')}
        />
      </button>
    </TableHead>
  );
}

/**
 * A breakdown of one total by its parts: revenue by channel, signups by country, spend by vendor.
 * Each row writes its figure, its share and its change, and with `bars` a bar of its size against
 * the largest row, so the figures are always there to read and the bars only help the eye. Past the
 * limit, the smallest rows gather into one others row the reader can open.
 */
export function BreakdownTable({
  items,
  title,
  description,
  format = 'number',
  currency,
  locale: requestedLocale,
  variant = 'bars',
  defaultSort = { key: 'value', ascending: false },
  sortable = true,
  limit = 8,
  total = true,
  comparison,
  better = 'up',
  actions,
  headingLevel = 3,
  messages,
  className,
}: BreakdownTableProps) {
  const m = mergeMessages(BREAKDOWN_TABLE_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const { Button, Reveal } = useBlockParts();
  const headingId = useId();
  const [sort, setSort] = useState<BreakdownSort>(defaultSort);
  const [expanded, setExpanded] = useState(false);
  const model = breakdownModel(items, { sort, limit: expanded ? undefined : limit, locale });
  const fullCount = items.length;
  const canExpand = expanded || model.hidden > 0;
  const write = (value: number) => formatValue(value, format, { locale, currency });
  const percent = (value: number) =>
    formatValue(value, 'percent', { locale, maximumFractionDigits: 1 });
  const hasChange = model.rows.some((row) => row.previous !== null);
  const bars = variant === 'bars';
  const onSort = (key: BreakdownSortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : // Names read A to Z first; figures largest first.
          { key, ascending: key === 'label' },
    );
  };
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  const changeCell = (change: number | null, previous: number | null) =>
    change === null ? (
      <span className="text-fg-subtle">
        <span aria-hidden>{previous === null ? '' : '0'}</span>
        <span className="sr-only">{m.noChange}</span>
      </span>
    ) : (
      <TrendChip value={change} locale={locale} better={better} variant="plain" size="sm" />
    );

  return (
    <section
      aria-labelledby={headingId}
      data-slot="block"
      className={cn(
        '@container flex min-w-0 flex-col gap-4 rounded-panel border border-line bg-surface py-5 shadow-panel translucent-surface',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading id={headingId} className="text-base font-heading text-fg">
            {title ?? m.title}
          </Heading>
          {description !== undefined && <p className="text-sm text-fg-muted">{description}</p>}
        </div>
        {actions}
      </header>
      <Reveal>
        {items.length === 0 ? (
          <p className="px-5 text-sm text-fg-muted">{m.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-labelledby={headingId} className={cn(!bars && 'text-sm')}>
              <TableHeader>
                <TableRow>
                  <SortHead
                    column="label"
                    sort={sort}
                    onSort={onSort}
                    sortable={sortable}
                    edge="start"
                  >
                    {m.labelHeader}
                  </SortHead>
                  <SortHead
                    column="value"
                    sort={sort}
                    onSort={onSort}
                    sortable={sortable}
                    align="end"
                  >
                    {m.valueHeader}
                  </SortHead>
                  <TableHead align="end" className="hidden @md:table-cell">
                    {m.shareHeader}
                  </TableHead>
                  {hasChange && (
                    <SortHead
                      column="change"
                      sort={sort}
                      onSort={onSort}
                      sortable={sortable}
                      align="end"
                      edge="end"
                    >
                      <span>{m.changeHeader}</span>
                      {comparison !== undefined && <span className="sr-only">, {comparison}</span>}
                    </SortHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {model.rows.map((row) => (
                  <TableRow key={row.id} data-other={row.other || undefined}>
                    <TableCell className="ps-5">
                      <span className="flex min-w-0 flex-col gap-1.5 py-1">
                        <span
                          className={cn('truncate whitespace-normal', row.other && 'text-fg-muted')}
                        >
                          {row.other ? m.other(row.count) : row.label}
                        </span>
                        {bars && (
                          <span aria-hidden className="block h-1.5 w-full max-w-64">
                            <span
                              className={cn(
                                'block h-full rounded-badge',
                                row.other ? 'bg-chart-reference' : 'bg-chart-series-1',
                              )}
                              style={{ width: `${String(Math.max(row.length * 100, 1))}%` }}
                            />
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell align="end" className="font-medium numeric">
                      {write(row.value)}
                      <span className="block text-xs font-normal text-fg-muted @md:hidden">
                        {percent(row.share)}
                      </span>
                    </TableCell>
                    <TableCell align="end" className="hidden text-fg-muted numeric @md:table-cell">
                      {percent(row.share)}
                    </TableCell>
                    {hasChange && (
                      <TableCell align="end" className="pe-5">
                        {changeCell(row.change, row.previous)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
              {total && (
                <TableFooter>
                  <TableRow>
                    <TableHead scope="row" className="ps-5 text-fg">
                      {m.total}
                    </TableHead>
                    <TableCell align="end" className="font-strong numeric">
                      {write(model.total)}
                    </TableCell>
                    <TableCell align="end" className="hidden text-fg-muted numeric @md:table-cell">
                      {percent(1)}
                    </TableCell>
                    {hasChange && (
                      <TableCell align="end" className="pe-5">
                        {changeCell(model.totalChange, model.totalPrevious)}
                      </TableCell>
                    )}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </Reveal>
      {canExpand && (
        <div className="px-5">
          {/* A ghost button: its label lines up with the names above, its padding hangs outside. */}
          <Button
            variant="ghost"
            size="sm"
            className="-ms-(--rx-button-padding-x-sm)"
            aria-expanded={expanded}
            onClick={() => {
              setExpanded((open) => !open);
            }}
          >
            {expanded ? m.showFewer : m.showAll(fullCount)}
          </Button>
        </div>
      )}
    </section>
  );
}
