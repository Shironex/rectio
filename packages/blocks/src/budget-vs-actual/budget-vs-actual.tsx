import { ArrowDownIcon, ArrowUpIcon, EqualsIcon } from '@phosphor-icons/react';
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

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Swatch } from '../lib/chart';
import { formatPercent, resolveLocale } from '../lib/finance';
import {
  ON_BUDGET,
  budgetSummary,
  variance,
  type BudgetKind,
  type BudgetLine,
  type Variance,
} from './budget-vs-actual.logic';

export interface BudgetVsActualProps {
  lines: readonly BudgetLine[];
  currency: string;
  locale?: string;
  /** `expense` (default) treats under budget as good; `revenue` treats over budget as good. */
  kind?: BudgetKind;
  title?: string;
  /** The period, such as "Q1 2026, 11 of 13 weeks". */
  period?: string;
  className?: string;
}

const ICON = { under: ArrowDownIcon, over: ArrowUpIcon, on: EqualsIcon };

/**
 * Variance in three signals that agree: the amount signed as actual minus budget (plus is over),
 * an arrow with the words over or under, and colour for good or bad news, which depends on `kind`.
 */
function VarianceCell({ v, currency, locale }: { v: Variance; currency: string; locale: string }) {
  const { Money } = useBlockParts();
  const Icon = ICON[v.position];
  const words =
    v.position === 'on'
      ? 'On budget'
      : `${v.relative === null ? '' : `${formatPercent(Math.abs(v.relative), locale, { digits: 0 })} `}${v.position}`;
  return (
    <span
      className={cn(
        'flex flex-col items-end',
        v.favourable === true && 'text-positive-strong',
        v.favourable === false && 'text-negative-strong',
        v.favourable === null && 'text-fg-muted',
      )}
    >
      <Money
        amount={v.position === 'under' ? -Math.abs(v.amount) : Math.abs(v.amount)}
        currency={currency}
        locale={locale}
        signDisplay="exceptZero"
      />
      <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap">
        <Icon aria-hidden weight="bold" className="size-3" />
        {words}
      </span>
    </span>
  );
}

/**
 * A bullet bar against the line's own budget: the outline is 100% of budget, the solid bar what is
 * spent within it, and spend past the budget continues in the second series colour beyond the
 * outline. `track` is the largest actual-to-budget ratio in the table, so every row shares a scale
 * of "share of its budget" and an overrun always fits.
 */
function Meter({ budget, actual, track }: { budget: number; actual: number; track: number }) {
  const ratio = budget <= 0 ? 0 : actual / budget;
  const within = Math.min(ratio, 1) / track;
  // Within the on-budget tolerance there is no overrun to draw, matching the "On budget" label.
  const past = ratio - 1 < ON_BUDGET ? 0 : (ratio - 1) / track;
  return (
    <span aria-hidden className="relative block h-3 w-full">
      <span
        className="absolute inset-y-0 start-0 rounded-badge border border-chart-reference"
        style={{ width: `${String(100 / track)}%` }}
      />
      <span
        className="absolute inset-y-0.5 start-0 w-full origin-left rounded-badge bg-chart-series-1"
        style={{ transform: `scaleX(${String(within)})` }}
      />
      {past > 0 && (
        <span
          className="absolute inset-y-0.5 start-0 w-full origin-left rounded-badge bg-chart-series-2"
          style={{ transform: `translateX(${String(100 / track)}%) scaleX(${String(past)})` }}
        />
      )}
    </span>
  );
}

/**
 * Budget against actual per category: a bullet bar for the shape, then budget, actual and the
 * variance with its sign, an arrow and the word over or under, so it never rests on colour.
 */
export function BudgetVsActual({
  lines,
  currency,
  locale: requestedLocale,
  kind = 'expense',
  title = 'Budget vs actual',
  period,
  className,
}: BudgetVsActualProps) {
  const locale = resolveLocale(requestedLocale);
  const { Money } = useBlockParts();
  const summary = budgetSummary(lines, kind, currency);
  const track = Math.max(
    1,
    ...lines.map((line) => (line.budget > 0 ? line.actual / line.budget : 1)),
  );
  return (
    <BlockPanel
      title={title}
      description={[
        period,
        lines.length === 0
          ? 'no budget set'
          : summary.unfavourable === 0
            ? 'every category on track'
            : `${String(summary.unfavourable)} of ${String(lines.length)} ${kind === 'expense' ? 'over budget' : 'below target'}`,
      ]
        .filter(Boolean)
        .join(', ')}
      className={className}
      bodyClassName="gap-3"
    >
      {lines.length === 0 ? (
        <EmptyNote title="No budget for this period">
          Set a budget per category to compare spending against it.
        </EmptyNote>
      ) : (
        <>
          <ul className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted @2xl:flex">
            <li className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2.5 w-3.5 rounded-badge border border-chart-reference"
              />
              Budget
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Swatch color="series-1" />
              Actual
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Swatch color="series-2" />
              Over budget
            </li>
          </ul>
          <Table>
            <TableCaption className="sr-only">
              Budget against actual by category, in {currency}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="hidden w-2/5 @2xl:table-cell">Spent of each budget</TableHead>
                <TableHead align="end" className="hidden @xl:table-cell">
                  Budget
                </TableHead>
                <TableHead align="end" className="hidden @xl:table-cell">
                  Actual
                </TableHead>
                <TableHead align="end">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <span className="block">{line.category}</span>
                    <span className="block text-sm text-fg-muted @xl:hidden">
                      <Money amount={line.actual} currency={currency} locale={locale} /> of{' '}
                      <Money amount={line.budget} currency={currency} locale={locale} />
                    </span>
                  </TableCell>
                  <TableCell className="hidden @2xl:table-cell">
                    <Meter budget={line.budget} actual={line.actual} track={track} />
                  </TableCell>
                  <TableCell align="end" className="hidden text-fg-muted @xl:table-cell">
                    <Money amount={line.budget} currency={currency} locale={locale} />
                  </TableCell>
                  <TableCell align="end" className="hidden @xl:table-cell">
                    <Money amount={line.actual} currency={currency} locale={locale} />
                  </TableCell>
                  <TableCell align="end">
                    <VarianceCell
                      v={variance(line, kind, currency)}
                      currency={currency}
                      locale={locale}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableHead scope="row" className="text-fg">
                  Total
                  <span className="block text-sm font-regular whitespace-normal text-fg-muted @xl:hidden">
                    <Money amount={summary.actual} currency={currency} locale={locale} /> of{' '}
                    <Money amount={summary.budget} currency={currency} locale={locale} />
                  </span>
                </TableHead>
                <TableCell className="hidden @2xl:table-cell" />
                <TableCell align="end" className="hidden @xl:table-cell">
                  <Money amount={summary.budget} currency={currency} locale={locale} />
                </TableCell>
                <TableCell align="end" className="hidden @xl:table-cell">
                  <Money
                    amount={summary.actual}
                    currency={currency}
                    locale={locale}
                    className="font-strong"
                  />
                </TableCell>
                <TableCell align="end">
                  <VarianceCell v={summary.variance} currency={currency} locale={locale} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </>
      )}
    </BlockPanel>
  );
}
