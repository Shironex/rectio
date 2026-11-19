import { ArrowDownIcon, ArrowUpIcon, EqualsIcon, TargetIcon } from '@phosphor-icons/react';
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
import type { ReactNode } from 'react';

import { formatPercent, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
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
  /** Shown in the empty state under its note, such as a button that sets the first budget. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `BUDGET_VS_ACTUAL_MESSAGES`. */
  messages?: Partial<BudgetVsActualMessages>;
  className?: string;
}

export interface BudgetVsActualMessages extends CommonMessages {
  title: string;
  /** Under the title, after the period: nothing set, all on track, or how many went wrong. */
  noBudgetSet: string;
  allOnTrack: string;
  /** "3 of 8 over budget" (expense) or "3 of 8 below target" (revenue). */
  offTrack: (count: number, total: number, kind: BudgetKind) => string;
  emptyTitle: string;
  emptyNote: string;
  legendBudget: string;
  legendActual: string;
  legendOver: string;
  tableCaption: (currency: string) => string;
  category: string;
  spentOfBudget: string;
  budget: string;
  actual: string;
  variance: string;
  /** Under a category on a narrow block: "€820 of €1,000". */
  actualOfBudget: (actual: ReactNode, budget: ReactNode) => ReactNode;
  total: string;
  /** The variance's words: "12% over" or "5% under"; `percent` is null for a zero budget. */
  varianceWords: (position: 'under' | 'over', percent: string | null) => string;
  onBudget: string;
}

export const BUDGET_VS_ACTUAL_MESSAGES: BudgetVsActualMessages = {
  ...COMMON_MESSAGES,
  title: 'Budget vs actual',
  noBudgetSet: 'no budget set',
  allOnTrack: 'every category on track',
  offTrack: (count, total, kind) =>
    `${String(count)} of ${String(total)} ${kind === 'expense' ? 'over budget' : 'below target'}`,
  emptyTitle: 'No budget for this period',
  emptyNote: 'Set a budget per category to compare spending against it.',
  legendBudget: 'Budget',
  legendActual: 'Actual',
  legendOver: 'Over budget',
  tableCaption: (currency) => `Budget against actual by category, in ${currency}`,
  category: 'Category',
  spentOfBudget: 'Spent of each budget',
  budget: 'Budget',
  actual: 'Actual',
  variance: 'Variance',
  actualOfBudget: (actual, budget) => (
    <>
      {actual} of {budget}
    </>
  ),
  total: 'Total',
  varianceWords: (position, percent) => `${percent === null ? '' : `${percent} `}${position}`,
  onBudget: 'On budget',
};

const ICON = { under: ArrowDownIcon, over: ArrowUpIcon, on: EqualsIcon };

/**
 * Variance in three signals that agree: the amount signed as actual minus budget (plus is over),
 * an arrow with the words over or under, and colour for good or bad news, which depends on `kind`.
 */
function VarianceCell({
  v,
  currency,
  locale,
  m,
}: {
  v: Variance;
  currency: string;
  locale: string;
  m: BudgetVsActualMessages;
}) {
  const { Money } = useBlockParts();
  const Icon = ICON[v.position];
  const words =
    v.position === 'on'
      ? m.onBudget
      : m.varianceWords(
          v.position,
          v.relative === null ? null : formatPercent(Math.abs(v.relative), locale, { digits: 0 }),
        );
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
  title,
  period,
  emptyAction,
  messages,
  className,
}: BudgetVsActualProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(BUDGET_VS_ACTUAL_MESSAGES, messages);
  const { Money } = useBlockParts();
  const summary = budgetSummary(lines, kind, currency);
  const track = Math.max(
    1,
    ...lines.map((line) => (line.budget > 0 ? line.actual / line.budget : 1)),
  );
  return (
    <BlockPanel
      title={title ?? m.title}
      description={[
        period,
        lines.length === 0
          ? m.noBudgetSet
          : summary.unfavourable === 0
            ? m.allOnTrack
            : m.offTrack(summary.unfavourable, lines.length, kind),
      ]
        .filter(Boolean)
        .join(', ')}
      className={className}
      bodyClassName="gap-3"
    >
      {lines.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={TargetIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <ul className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted @2xl:flex">
            <li className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2.5 w-3.5 rounded-badge border border-chart-reference"
              />
              {m.legendBudget}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Swatch color="series-1" />
              {m.legendActual}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Swatch color="series-2" />
              {m.legendOver}
            </li>
          </ul>
          <Table>
            <TableCaption className="sr-only">{m.tableCaption(currency)}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{m.category}</TableHead>
                <TableHead className="hidden w-2/5 @2xl:table-cell">{m.spentOfBudget}</TableHead>
                <TableHead align="end" className="hidden @xl:table-cell">
                  {m.budget}
                </TableHead>
                <TableHead align="end" className="hidden @xl:table-cell">
                  {m.actual}
                </TableHead>
                <TableHead align="end">{m.variance}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <span className="block">{line.category}</span>
                    <span className="block text-sm text-fg-muted @xl:hidden">
                      {m.actualOfBudget(
                        <Money amount={line.actual} currency={currency} locale={locale} />,
                        <Money amount={line.budget} currency={currency} locale={locale} />,
                      )}
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
                      m={m}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableHead scope="row" className="text-fg">
                  {m.total}
                  <span className="block text-sm font-regular whitespace-normal text-fg-muted @xl:hidden">
                    {m.actualOfBudget(
                      <Money amount={summary.actual} currency={currency} locale={locale} />,
                      <Money amount={summary.budget} currency={currency} locale={locale} />,
                    )}
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
                  <VarianceCell v={summary.variance} currency={currency} locale={locale} m={m} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </>
      )}
    </BlockPanel>
  );
}
