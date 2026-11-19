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
import { Swatch } from '../lib/chart';
import { formatPercent, resolveLocale } from '../lib/finance';
import {
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

/** Variance in three signals: a signed amount, an arrow with the words over or under, and colour. */
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
      <Money amount={v.amount} currency={currency} locale={locale} signDisplay="exceptZero" />
      <span className="inline-flex items-center gap-1 text-sm">
        <Icon aria-hidden weight="bold" className="size-3" />
        {words}
      </span>
    </span>
  );
}

/**
 * A bullet bar: the budget as an outlined extent, the actual as a solid bar, and any spend past the
 * budget in the second series colour. Lengths share one scale across the table.
 */
function Meter({ budget, actual, scale }: { budget: number; actual: number; scale: number }) {
  const within = Math.min(actual, budget) / scale;
  const past = Math.max(actual - budget, 0) / scale;
  return (
    <span aria-hidden className="relative block h-3 w-full">
      <span
        className="absolute inset-y-0 start-0 rounded-badge border border-chart-reference"
        style={{ width: `${String((budget / scale) * 100)}%` }}
      />
      <span
        className="absolute inset-y-0.5 start-0 w-full origin-left rounded-badge bg-chart-series-1"
        style={{ transform: `scaleX(${String(within)})` }}
      />
      {past > 0 && (
        <span
          className="absolute inset-y-0.5 start-0 w-full origin-left bg-chart-series-2"
          style={{
            transform: `translateX(${String(within * 100)}%) scaleX(${String(past)})`,
          }}
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
  const scale = Math.max(1, ...lines.flatMap((line) => [line.budget, line.actual]));
  return (
    <BlockPanel
      title={title}
      description={[
        period,
        summary.unfavourable === 0
          ? 'every category on track'
          : `${String(summary.unfavourable)} of ${String(lines.length)} ${kind === 'expense' ? 'over budget' : 'below target'}`,
      ]
        .filter(Boolean)
        .join(', ')}
      className={className}
      bodyClassName="gap-3"
    >
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
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
          Past budget
        </li>
      </ul>
      <Table>
        <TableCaption className="sr-only">
          Budget against actual by category, in {currency}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="hidden w-2/5 md:table-cell">
              <span className="sr-only">Actual against budget</span>
            </TableHead>
            <TableHead align="end" className="hidden sm:table-cell">
              Budget
            </TableHead>
            <TableHead align="end">Actual</TableHead>
            <TableHead align="end">Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>
                <span className="block">{line.category}</span>
                <span className="block text-sm text-fg-muted sm:hidden">
                  of <Money amount={line.budget} currency={currency} locale={locale} />
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Meter budget={line.budget} actual={line.actual} scale={scale} />
              </TableCell>
              <TableCell align="end" className="hidden text-fg-muted sm:table-cell">
                <Money amount={line.budget} currency={currency} locale={locale} />
              </TableCell>
              <TableCell align="end">
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
            </TableHead>
            <TableCell className="hidden md:table-cell" />
            <TableCell align="end" className="hidden sm:table-cell">
              <Money amount={summary.budget} currency={currency} locale={locale} />
            </TableCell>
            <TableCell align="end">
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
    </BlockPanel>
  );
}
