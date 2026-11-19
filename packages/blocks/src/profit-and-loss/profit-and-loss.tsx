import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  CaretRightIcon,
  EqualsIcon,
  ScalesIcon,
} from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useId, useState, type ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Figures } from '../lib/figures';
import { formatPercent, resolveLocale } from '../lib/finance';
import { mergeMessages } from '../lib/messages';
import {
  PL_RESULTS,
  PL_SECTIONS,
  lineChange,
  profitAndLoss,
  type PlChange,
  type PlFigure,
  type PlLine,
  type PlResult,
  type PlSection,
} from './profit-and-loss.logic';

export interface ProfitAndLossProps {
  /** Account lines; each names its section and carries the period's amount. */
  lines: readonly PlLine[];
  currency: string;
  locale?: string;
  /** The period's name, such as "Q1 2026"; heads the amount column. */
  period?: string;
  /** The comparison period's name, such as "Q1 2025"; heads its column when lines carry one. */
  comparisonPeriod?: string;
  /** Sections that start folded to their subtotal. */
  defaultCollapsed?: readonly PlSection[];
  title?: string;
  /** Shown in the empty state under its note, such as a link that imports the books. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `PROFIT_AND_LOSS_MESSAGES`. */
  messages?: Partial<ProfitAndLossMessages>;
  className?: string;
}

export interface ProfitAndLossMessages {
  title: string;
  /** Under the title: "Q1 2026 against Q1 2025". Either may be absent. */
  summary: (period: string | undefined, comparison: string | undefined) => ReactNode;
  /** Each section's heading. */
  sections: Record<PlSection, string>;
  /** Each section's subtotal row. */
  sectionTotals: Record<PlSection, string>;
  /** The result rows between the sections. */
  results: Record<PlResult, string>;
  /** The last line's words when it is negative. */
  netLoss: string;
  account: string;
  /** The amount column's header when no period is named. */
  current: string;
  /** The comparison column's header when no comparison period is named. */
  comparison: string;
  change: string;
  revenueFigure: string;
  grossMarginFigure: string;
  /** Under the gross margin figure: "€48,200 gross profit". */
  /** Under the gross margin: the gross profit, and the margin's move in points when compared. */
  grossProfitNote: (amount: ReactNode) => ReactNode;
  /** Under the net figure: "11% net margin". */
  netMarginNote: (margin: string) => string;
  /** The gross margin's move in percentage points: "+0.9 pts on Q1 2025". */
  pointsOn: (points: string, comparison: string) => string;
  /** Under the revenue figure: "+8% on Q1 2025". */
  changeOn: (change: string, comparison: string) => string;
  /** Under a result's name: "38% margin". */
  margin: (margin: string) => string;
  /** A change in words: "8% up", "8% down", or "Up" when there was nothing before. */
  changeWords: (direction: 'up' | 'down', share: string | null) => string;
  noChange: string;
  /** On a narrow block, under the amount: "from €12,400". */
  from: (amount: ReactNode) => ReactNode;
  collapseAll: string;
  expandAll: string;
  emptyTitle: string;
  emptyNote: string;
  tableCaption: (currency: string) => string;
}

export const PROFIT_AND_LOSS_MESSAGES: ProfitAndLossMessages = {
  title: 'Profit and loss',
  summary: (period, comparison) =>
    period === undefined
      ? (comparison ?? '')
      : comparison === undefined
        ? period
        : `${period} against ${comparison}`,
  sections: {
    revenue: 'Revenue',
    costOfSales: 'Cost of sales',
    operatingExpenses: 'Operating expenses',
    otherIncome: 'Other income',
    otherExpenses: 'Other expenses',
    tax: 'Tax',
  },
  sectionTotals: {
    revenue: 'Total revenue',
    costOfSales: 'Total cost of sales',
    operatingExpenses: 'Total operating expenses',
    otherIncome: 'Total other income',
    otherExpenses: 'Total other expenses',
    tax: 'Total tax',
  },
  results: {
    grossProfit: 'Gross profit',
    operatingProfit: 'Operating profit',
    profitBeforeTax: 'Profit before tax',
    netProfit: 'Net profit',
  },
  netLoss: 'Net loss',
  account: 'Account',
  current: 'This period',
  comparison: 'Comparison',
  change: 'Change',
  revenueFigure: 'Revenue',
  grossMarginFigure: 'Gross margin',
  grossProfitNote: (amount) => <>{amount} gross profit</>,
  netMarginNote: (margin) => `${margin} net margin`,
  pointsOn: (points, comparison) => `${points} pts on ${comparison}`,
  changeOn: (change, comparison) => `${change} on ${comparison}`,
  margin: (margin) => `${margin} margin`,
  changeWords: (direction, share) =>
    share === null ? (direction === 'up' ? 'Up' : 'Down') : `${share} ${direction}`,
  noChange: 'No change',
  from: (amount) => <>from {amount}</>,
  collapseAll: 'Collapse all',
  expandAll: 'Expand all',
  emptyTitle: 'Nothing booked for this period',
  emptyNote: 'Revenue and costs appear here as a statement once the period has entries.',
  tableCaption: (currency) => `Income statement, amounts in ${currency}`,
};

const ARROW = { up: ArrowUpIcon, down: ArrowDownIcon, flat: EqualsIcon };

/** Which results the statement prints: each only where the sections above it make it differ. */
function shownResults(has: (section: PlSection) => boolean): Record<PlResult, boolean> {
  return {
    grossProfit: has('costOfSales'),
    operatingProfit: has('operatingExpenses'),
    profitBeforeTax: (has('otherIncome') || has('otherExpenses')) && has('tax'),
    netProfit: true,
  };
}

/** Where each result sits: after the section named here. */
const RESULT_AFTER: Record<PlResult, PlSection> = {
  grossProfit: 'costOfSales',
  operatingProfit: 'operatingExpenses',
  profitBeforeTax: 'otherExpenses',
  netProfit: 'tax',
};

function tone(change: PlChange) {
  return change.favourable === true
    ? 'text-positive-strong'
    : change.favourable === false
      ? 'text-negative-strong'
      : 'text-fg-muted';
}

/**
 * A change in three signals that agree: the amount signed as current minus comparison, an arrow
 * with the words up or down, and colour for whether it helps profit, which flips for costs.
 */
function ChangeCell({
  change,
  currency,
  locale,
  m,
}: {
  change: PlChange;
  currency: string;
  locale: string;
  m: ProfitAndLossMessages;
}) {
  const { Money } = useBlockParts();
  const Icon = ARROW[change.direction];
  return (
    // Stacked in a mid-width column; on one line once the block is wide enough, the amount ends
    // the row under the Change heading and the words sit before it.
    <span
      className={cn(
        'flex flex-col items-end @4xl:flex-row-reverse @4xl:items-baseline @4xl:justify-start @4xl:gap-4',
        tone(change),
      )}
    >
      <Money amount={change.amount} currency={currency} locale={locale} signDisplay="exceptZero" />
      <span className="inline-flex min-w-30 items-center justify-end gap-1 text-sm whitespace-nowrap">
        <Icon aria-hidden weight="bold" className="size-3" />
        {words(change, locale, m)}
      </span>
    </span>
  );
}

/** A margin's move in percentage points, signed: "+0.9". Undefined without both margins. */
function marginPoints(current: number | null, comparison: number | null, locale: string) {
  if (current === null || comparison === null) return undefined;
  const points = Math.round((current - comparison) * 1000) / 10;
  return {
    text: new Intl.NumberFormat(locale, { signDisplay: 'exceptZero', maximumFractionDigits: 1 })
      .format(points)
      .replace('-', '\u2212'),
    direction: points > 0 ? ('up' as const) : points < 0 ? ('down' as const) : ('flat' as const),
  };
}

/** A figure's change under it, in the table's three signals: arrow, signed words and good or bad. */
function Toned({
  direction,
  favourable,
  children,
}: {
  direction: PlChange['direction'];
  favourable: PlChange['favourable'];
  children: ReactNode;
}) {
  const Icon = ARROW[direction];
  return (
    <span className={cn('inline-flex items-center gap-1', tone({ favourable } as PlChange))}>
      <Icon aria-hidden weight="bold" className="size-3" />
      {children}
    </span>
  );
}

function words(change: PlChange, locale: string, m: ProfitAndLossMessages) {
  if (change.direction === 'flat') return m.noChange;
  return m.changeWords(
    change.direction,
    change.relative === null
      ? null
      : formatPercent(Math.abs(change.relative), locale, { digits: 0 }),
  );
}

/** On a narrow block the comparison and change fold under the amount, in one short line. */
function Folded({
  figure,
  currency,
  locale,
  m,
}: {
  figure: Pick<PlFigure, 'comparison' | 'change'>;
  currency: string;
  locale: string;
  m: ProfitAndLossMessages;
}) {
  const { Money } = useBlockParts();
  if (figure.change === null || figure.comparison === null) return null;
  const Icon = ARROW[figure.change.direction];
  return (
    <span className="flex flex-col items-end text-sm font-regular @xl:hidden">
      <span className={cn('flex flex-col items-end', tone(figure.change))}>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <Icon aria-hidden weight="bold" className="size-3" />
          <Money
            amount={figure.change.amount}
            currency={currency}
            locale={locale}
            signDisplay="exceptZero"
          />
        </span>
        <span className="whitespace-nowrap">{words(figure.change, locale, m)}</span>
      </span>
      <span className="whitespace-nowrap text-fg-muted">
        {m.from(<Money amount={figure.comparison} currency={currency} locale={locale} />)}
      </span>
    </span>
  );
}

/**
 * An income statement for a period, with an optional comparison period: revenue and costs by
 * section with indented accounts, subtotals, gross and operating profit and the net line, each
 * with its margin, and the change against the comparison in sign, arrow and words. Sections fold to
 * their subtotal; on a narrow block the comparison and change fold under the amount.
 */
export function ProfitAndLoss({
  lines,
  currency,
  locale: requestedLocale,
  period,
  comparisonPeriod,
  defaultCollapsed = [],
  title,
  emptyAction,
  messages,
  className,
}: ProfitAndLossProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(PROFIT_AND_LOSS_MESSAGES, messages);
  const { Button, Money } = useBlockParts();
  const baseId = useId();
  const [collapsed, setCollapsed] = useState<ReadonlySet<PlSection>>(
    () => new Set(defaultCollapsed),
  );
  const statement = profitAndLoss(lines, currency);
  const compare = statement.hasComparison;
  const present = PL_SECTIONS.filter((section) => statement.sections[section].lines.length > 0);
  const results = shownResults((section) => present.includes(section));
  const net = statement.results.netProfit;
  const grossPoints = marginPoints(
    statement.margins.current.gross,
    statement.margins.comparison?.gross ?? null,
    locale,
  );
  const percent = (value: number | null) =>
    value === null ? null : formatPercent(value, locale, { digits: 1 });
  const allCollapsed = present.every((section) => collapsed.has(section));

  const toggle = (section: PlSection) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const money = (amount: number, className?: string) => (
    <Money amount={amount} currency={currency} locale={locale} className={className} />
  );

  /** The amount, comparison and change cells of a figure row. */
  const figureCells = (figure: PlFigure, strong?: string) => (
    <>
      <TableCell align="end" className="align-top">
        <span className="flex flex-col items-end gap-0.5">
          {money(figure.current, strong)}
          <Folded figure={figure} currency={currency} locale={locale} m={m} />
        </span>
      </TableCell>
      {compare && (
        <>
          <TableCell align="end" className="hidden align-top text-fg-muted @xl:table-cell">
            {figure.comparison !== null && money(figure.comparison)}
          </TableCell>
          <TableCell align="end" className="hidden align-top @xl:table-cell">
            {figure.change !== null && (
              <ChangeCell change={figure.change} currency={currency} locale={locale} m={m} />
            )}
          </TableCell>
        </>
      )}
    </>
  );

  const resultRow = (result: PlResult) => {
    const figure = statement.results[result];
    const marginKey =
      result === 'grossProfit' ? 'gross' : result === 'netProfit' ? 'net' : 'operating';
    const margin = percent(statement.margins.current[marginKey]);
    const last = result === 'netProfit';
    const label = last && figure.current < 0 ? m.netLoss : m.results[result];
    return (
      <TableRow
        key={result}
        data-result={result}
        // A rule above as well as the tint: a sunken tint alone fades on a dark surface.
        className={cn(
          'bg-surface-sunken [&>td]:border-t [&>td]:border-line-strong',
          // The net figure is set large; the smaller cells sit on its baseline.
          last && '[&>td]:align-baseline',
        )}
      >
        <TableCell className="align-top">
          <span className={cn('block font-strong', last && 'text-xl tracking-tight')}>{label}</span>
          {margin !== null && (
            <span className="block text-sm text-fg-muted">{m.margin(margin)}</span>
          )}
        </TableCell>
        {figureCells(figure, cn('font-strong', last && 'text-xl tracking-tight'))}
      </TableRow>
    );
  };

  const revenue = statement.sections.revenue;
  const revenueChange =
    revenue.change?.relative == null || comparisonPeriod === undefined
      ? undefined
      : m.changeOn(
          formatPercent(revenue.change.relative, locale, { signed: true }),
          comparisonPeriod,
        );
  const grossMargin = percent(statement.margins.current.gross);
  const netMargin = percent(statement.margins.current.net);

  return (
    <BlockPanel
      title={title ?? m.title}
      description={
        period === undefined && comparisonPeriod === undefined
          ? undefined
          : m.summary(period, compare ? comparisonPeriod : undefined)
      }
      actions={
        present.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCollapsed(allCollapsed ? new Set() : new Set(present));
            }}
          >
            {allCollapsed ? (
              <ArrowsOutSimpleIcon aria-hidden weight="bold" className="size-4" />
            ) : (
              <ArrowsInSimpleIcon aria-hidden weight="bold" className="size-4" />
            )}
            {allCollapsed ? m.expandAll : m.collapseAll}
          </Button>
        )
      }
      className={className}
      bodyClassName="gap-4"
    >
      {lines.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={ScalesIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              {
                label: m.revenueFigure,
                amount: revenue.current,
                note:
                  revenueChange === undefined || revenue.change === null ? undefined : (
                    <Toned
                      direction={revenue.change.direction}
                      favourable={revenue.change.favourable}
                    >
                      {revenueChange}
                    </Toned>
                  ),
              },
              {
                label: m.grossMarginFigure,
                value: grossMargin ?? '',
                note: (
                  <>
                    <span className="block">
                      {m.grossProfitNote(money(statement.results.grossProfit.current))}
                    </span>
                    {grossPoints !== undefined && comparisonPeriod !== undefined && (
                      <Toned
                        direction={grossPoints.direction}
                        favourable={
                          grossPoints.direction === 'flat' ? null : grossPoints.direction === 'up'
                        }
                      >
                        {m.pointsOn(grossPoints.text, comparisonPeriod)}
                      </Toned>
                    )}
                  </>
                ),
              },
              {
                label: net.current < 0 ? m.netLoss : m.results.netProfit,
                amount: net.current,
                signed: true,
                ...(net.current < 0 ? { emphasis: 'negative' as const } : {}),
                note: (
                  <>
                    {netMargin !== null && (
                      <span className="block">{m.netMarginNote(netMargin)}</span>
                    )}
                    {net.change?.relative != null && comparisonPeriod !== undefined && (
                      <Toned direction={net.change.direction} favourable={net.change.favourable}>
                        {m.changeOn(
                          formatPercent(net.change.relative, locale, { signed: true }),
                          comparisonPeriod,
                        )}
                      </Toned>
                    )}
                  </>
                ),
              },
            ]}
          />
          <Table>
            <TableCaption className="sr-only">{m.tableCaption(currency)}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{m.account}</TableHead>
                <TableHead align="end">{period ?? m.current}</TableHead>
                {compare && (
                  <>
                    <TableHead align="end" className="hidden @xl:table-cell">
                      {comparisonPeriod ?? m.comparison}
                    </TableHead>
                    <TableHead align="end" className="hidden @xl:table-cell">
                      {m.change}
                    </TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PL_SECTIONS.flatMap((section) => {
                const rows: ReactNode[] = [];
                const totals = statement.sections[section];
                if (totals.lines.length > 0) {
                  const open = !collapsed.has(section);
                  const rowId = (index: number | 'total') =>
                    `${baseId}-${section}-${String(index)}`;
                  rows.push(
                    <TableRow key={`${section}-head`} data-section={section}>
                      <TableCell className={cn('align-top', open && 'border-b-0')}>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={[
                            ...totals.lines.map((_, index) => rowId(index)),
                            rowId('total'),
                          ].join(' ')}
                          onClick={() => {
                            toggle(section);
                          }}
                          className={cn(
                            '-ms-1.5 inline-flex min-h-(--rx-control-height-sm) cursor-pointer items-center gap-1.5 rounded-control ps-1 pe-2 text-start font-strong',
                            'pointer-coarse:min-h-(--rx-control-height-touch)',
                            'transition-colors duration-fast ease-standard hover:bg-surface-hover',
                            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
                          )}
                        >
                          <CaretRightIcon
                            aria-hidden
                            weight="bold"
                            className={cn(
                              'size-3.5 shrink-0 text-fg-muted transition-transform duration-fast ease-standard',
                              open && 'rotate-90',
                            )}
                          />
                          {open ? m.sections[section] : m.sectionTotals[section]}
                        </button>
                      </TableCell>
                      {open ? (
                        <TableCell colSpan={compare ? 3 : 1} className="border-b-0" />
                      ) : (
                        figureCells(totals, 'font-medium')
                      )}
                    </TableRow>,
                    ...totals.lines.map((line, index) => (
                      <TableRow key={line.id} id={rowId(index)} hidden={!open}>
                        <TableCell className="ps-8 align-top">
                          {line.code !== undefined && (
                            // The code: above the name when narrow, beside it when wide.
                            <span className="block text-sm text-fg-muted numeric @xl:me-3 @xl:inline">
                              {line.code}
                            </span>
                          )}
                          {line.account}
                        </TableCell>
                        {figureCells({
                          current: line.current,
                          comparison: line.comparison ?? null,
                          change: lineChange(line, currency),
                        })}
                      </TableRow>
                    )),
                    <TableRow
                      key={`${section}-total`}
                      id={rowId('total')}
                      // One account is its own total: the subtotal row would repeat it.
                      hidden={!open || totals.lines.length === 1}
                    >
                      <TableCell className="align-top font-medium">
                        {m.sectionTotals[section]}
                      </TableCell>
                      {figureCells(totals, 'font-medium')}
                    </TableRow>,
                  );
                }
                for (const result of PL_RESULTS) {
                  if (
                    result !== 'netProfit' &&
                    RESULT_AFTER[result] === section &&
                    results[result]
                  ) {
                    rows.push(resultRow(result));
                  }
                }
                return rows;
              })}
            </TableBody>
            <TableFooter>{resultRow('netProfit')}</TableFooter>
          </Table>
        </>
      )}
    </BlockPanel>
  );
}
