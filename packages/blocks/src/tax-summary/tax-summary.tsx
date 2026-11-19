import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  PercentIcon,
  WarningCircleIcon,
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
import type { ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Figures } from '../lib/figures';
import { formatLongDate, formatPercent, resolveLocale } from '../lib/finance';
import { mergeMessages } from '../lib/messages';
import { StateBadge, type RecordState } from '../lib/state-badge';
import {
  daysToDue,
  isTaxOverdue,
  taxSummary,
  type TaxRate,
  type TaxRateEntry,
  type TaxStatus,
} from './tax-summary.logic';

export interface TaxSummaryProps {
  /** Output and input per rate for the filing period. */
  entries: readonly TaxRateEntry[];
  currency: string;
  locale?: string;
  /** The filing period, such as "Q1 2026". */
  period?: string;
  /** When the return (and any tax due) must be in. */
  due: Date;
  status: TaxStatus;
  today?: Date;
  /** Prepares the return while it is open, files it once it is ready. */
  onFile?: () => void;
  /** Offers an export of the figures, such as a CSV for the accountant. */
  onExport?: () => void;
  title?: string;
  /** Shown in the empty state under its note, such as a link to the invoices. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `TAX_SUMMARY_MESSAGES`. */
  messages?: Partial<TaxSummaryMessages>;
  className?: string;
}

/** The badge a return shows: its status, or overdue once that is what matters. */
export type TaxBadge = TaxStatus | 'overdue';

/** Where the due date stands, for the words beside it. */
export type DueState = 'upcoming' | 'today' | 'overdue' | 'filed' | 'paid';

export interface TaxSummaryMessages {
  title: string;
  /** Each status's badge word. */
  statuses: Record<TaxBadge, string>;
  outputFigure: string;
  inputFigure: string;
  payableFigure: string;
  refundFigure: string;
  nilFigure: string;
  /** Under output tax: "on €84,200 of sales". */
  outputNote: (base: ReactNode) => ReactNode;
  /** Under input tax: "on €31,600 of purchases". */
  inputNote: (base: ReactNode) => ReactNode;
  /** Under the net figure, in words: who pays whom. The due line above says by when. */
  netNote: (position: 'payable' | 'refund' | 'nil') => string;
  /** The due line: "Due 25 April 2026"; the date is formatted already. */
  dueOn: (date: string) => string;
  /** Beside the due date: "37 days left", "Due today", "3 days overdue", "Filed", "Paid". */
  dueState: (state: DueState, days: number) => string;
  rate: string;
  exempt: string;
  taxableSales: string;
  outputTax: string;
  taxablePurchases: string;
  inputTax: string;
  net: string;
  total: string;
  /** On a narrow block, under the rate: "Output €19,366.00". The bases show on wider blocks. */
  /** Narrow blocks: the output tax and its taxable base on one line under the rate. */
  foldedOutput: (tax: ReactNode, base: ReactNode) => ReactNode;
  /** Narrow blocks: the input tax and its taxable base on one line under the rate. */
  foldedInput: (tax: ReactNode, base: ReactNode) => ReactNode;
  prepare: string;
  file: string;
  export: string;
  emptyTitle: string;
  emptyNote: string;
  tableCaption: (currency: string) => string;
}

export const TAX_SUMMARY_MESSAGES: TaxSummaryMessages = {
  title: 'VAT return',
  statuses: {
    open: 'Open',
    ready: 'Ready to file',
    filed: 'Filed',
    paid: 'Paid',
    overdue: 'Overdue',
  },
  outputFigure: 'Output tax collected',
  inputFigure: 'Input tax paid',
  payableFigure: 'Net payable',
  refundFigure: 'Net refund',
  nilFigure: 'Nothing to pay',
  outputNote: (base) => <>on {base} of sales</>,
  inputNote: (base) => <>on {base} of purchases</>,
  netNote: (position) =>
    position === 'payable'
      ? 'Owed to the tax office'
      : position === 'refund'
        ? 'To reclaim from the tax office'
        : 'Output and input tax cancel out',
  dueOn: (date) => `Due ${date}`,
  dueState: (state, days) => {
    switch (state) {
      case 'upcoming':
        return `${String(days)} ${days === 1 ? 'day' : 'days'} left`;
      case 'today':
        return 'Due today';
      case 'overdue':
        return `${String(days)} ${days === 1 ? 'day' : 'days'} overdue`;
      case 'filed':
        return 'Filed';
      case 'paid':
        return 'Settled';
    }
  },
  rate: 'Rate',
  exempt: 'Exempt',
  taxableSales: 'Taxable sales',
  outputTax: 'Output tax',
  taxablePurchases: 'Taxable purchases',
  inputTax: 'Input tax',
  net: 'Net',
  total: 'Total',
  foldedOutput: (tax, base) => (
    <>
      <span className="whitespace-nowrap">Output tax {tax}</span>{' '}
      <span className="whitespace-nowrap text-fg-subtle">base {base}</span>
    </>
  ),
  foldedInput: (tax, base) => (
    <>
      <span className="whitespace-nowrap">Input tax {tax}</span>{' '}
      <span className="whitespace-nowrap text-fg-subtle">base {base}</span>
    </>
  ),
  prepare: 'Prepare return',
  file: 'File return',
  export: 'Export',
  emptyTitle: 'No taxable activity this period',
  emptyNote: 'Sales and purchases with tax appear here by rate, ready for the return.',
  tableCaption: (currency) => `Tax by rate, amounts in ${currency}`,
};

const BADGE: Record<TaxBadge, RecordState> = {
  open: 'pending',
  ready: 'due',
  filed: 'approved',
  paid: 'paid',
  overdue: 'overdue',
};

/**
 * VAT or sales tax for one filing period: output tax collected and input tax paid per rate, the
 * net to pay or reclaim in words, and the due date with the days left, turning to overdue once it
 * passes with the return or the payment outstanding. The primary action prepares or files.
 */
export function TaxSummary({
  entries,
  currency,
  locale: requestedLocale,
  period,
  due,
  status,
  today = new Date(),
  onFile,
  onExport,
  title,
  emptyAction,
  messages,
  className,
}: TaxSummaryProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(TAX_SUMMARY_MESSAGES, messages);
  const { Button, Money } = useBlockParts();
  const summary = taxSummary(entries, currency);
  const days = daysToDue(due, today);
  const overdue = isTaxOverdue(status, due, today, summary.position);
  const badge: TaxBadge = overdue ? 'overdue' : status;
  const dueState: DueState = overdue
    ? 'overdue'
    : status === 'paid'
      ? 'paid'
      : status === 'filed'
        ? summary.position === 'payable' && days >= 0
          ? days === 0
            ? 'today'
            : 'upcoming'
          : 'filed'
        : days === 0
          ? 'today'
          : 'upcoming';
  const dueText = formatLongDate(due, locale);
  const money = (amount: number, className?: string) => (
    <Money
      amount={amount}
      currency={currency}
      locale={locale}
      // A zero quietens, so the rates that carry tax stand out.
      className={cn('whitespace-nowrap', amount === 0 && 'text-fg-muted', className)}
    />
  );
  const rateLabel = (rate: TaxRate) =>
    rate === 'exempt' ? m.exempt : formatPercent(rate, locale, { digits: 1 });
  const empty = entries.length === 0;
  // Nothing to prepare or export on an empty period.
  const canFile = !empty && onFile !== undefined && (status === 'open' || status === 'ready');
  const canExport = !empty && onExport !== undefined;
  // A week out, with the return or the payment still to do, the date turns to a warning.
  const soon =
    !overdue &&
    days <= 7 &&
    (status === 'open' ||
      status === 'ready' ||
      (status === 'filed' && summary.position === 'payable'));

  return (
    <BlockPanel
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{title ?? m.title}</span>
          <StateBadge state={BADGE[badge]} label={m.statuses[badge]} />
        </span>
      }
      description={period}
      actions={
        (canExport || canFile) && (
          <>
            {canExport && (
              <Button variant="secondary" onClick={onExport}>
                <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
                {m.export}
              </Button>
            )}
            {canFile && (
              <Button onClick={onFile}>
                <FileTextIcon aria-hidden weight="bold" className="size-4" />
                {status === 'open' ? m.prepare : m.file}
              </Button>
            )}
          </>
        )
      }
      className={className}
      bodyClassName="gap-4"
    >
      <p
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm',
          overdue ? 'text-negative-strong' : soon ? 'text-warning-strong' : 'text-fg-muted',
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <CalendarBlankIcon aria-hidden weight="bold" className="size-4" />
          <span className={cn('numeric', !overdue && !soon && 'text-fg')}>{m.dueOn(dueText)}</span>
        </span>
        <span className={cn('inline-flex items-center gap-1', (overdue || soon) && 'font-medium')}>
          {(overdue || soon) && <WarningCircleIcon aria-hidden weight="bold" className="size-4" />}
          {m.dueState(dueState, Math.abs(days))}
        </span>
      </p>
      {entries.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={PercentIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              {
                label: m.outputFigure,
                amount: summary.outputTax,
                note: m.outputNote(money(summary.outputBase)),
              },
              {
                label: m.inputFigure,
                amount: summary.inputTax,
                note: m.inputNote(money(summary.inputBase)),
              },
              {
                label:
                  summary.position === 'payable'
                    ? m.payableFigure
                    : summary.position === 'refund'
                      ? m.refundFigure
                      : m.nilFigure,
                amount: Math.abs(summary.net),
                note: m.netNote(summary.position),
                ...(overdue && summary.position === 'payable'
                  ? { emphasis: 'negative' as const }
                  : {}),
              },
            ]}
          />
          <Table>
            <TableCaption className="sr-only">{m.tableCaption(currency)}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{m.rate}</TableHead>
                <TableHead align="end" className="hidden @3xl:table-cell">
                  {m.taxableSales}
                </TableHead>
                <TableHead align="end" className="hidden @3xl:table-cell">
                  {m.outputTax}
                </TableHead>
                <TableHead align="end" className="hidden @3xl:table-cell">
                  {m.taxablePurchases}
                </TableHead>
                <TableHead align="end" className="hidden @3xl:table-cell">
                  {m.inputTax}
                </TableHead>
                <TableHead align="end">{m.net}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="align-top">
                    <span className="block font-medium numeric">{rateLabel(row.rate)}</span>
                    <span className="block text-sm text-fg-muted @3xl:hidden">
                      {m.foldedOutput(money(row.outputTax), money(row.outputBase))}
                    </span>
                    <span className="block text-sm text-fg-muted @3xl:hidden">
                      {m.foldedInput(money(row.inputTax), money(row.inputBase))}
                    </span>
                  </TableCell>
                  <TableCell align="end" className="hidden align-top text-fg-muted @3xl:table-cell">
                    {money(row.outputBase)}
                  </TableCell>
                  <TableCell align="end" className="hidden align-top @3xl:table-cell">
                    {money(row.outputTax)}
                  </TableCell>
                  <TableCell align="end" className="hidden align-top text-fg-muted @3xl:table-cell">
                    {money(row.inputBase)}
                  </TableCell>
                  <TableCell align="end" className="hidden align-top @3xl:table-cell">
                    {money(row.inputTax)}
                  </TableCell>
                  <TableCell align="end" className="align-top">
                    {money(row.net, 'font-medium')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="align-top font-medium">
                  {m.total}
                  <span className="block text-sm font-regular text-fg-muted @3xl:hidden">
                    {m.foldedOutput(money(summary.outputTax), money(summary.outputBase))}
                  </span>
                  <span className="block text-sm font-regular text-fg-muted @3xl:hidden">
                    {m.foldedInput(money(summary.inputTax), money(summary.inputBase))}
                  </span>
                </TableCell>
                <TableCell align="end" className="hidden align-top @3xl:table-cell">
                  {money(summary.outputBase)}
                </TableCell>
                <TableCell align="end" className="hidden align-top @3xl:table-cell">
                  {money(summary.outputTax)}
                </TableCell>
                <TableCell align="end" className="hidden align-top @3xl:table-cell">
                  {money(summary.inputBase)}
                </TableCell>
                <TableCell align="end" className="hidden align-top @3xl:table-cell">
                  {money(summary.inputTax)}
                </TableCell>
                <TableCell align="end" className="align-top">
                  {money(summary.net, 'font-strong')}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </>
      )}
    </BlockPanel>
  );
}
